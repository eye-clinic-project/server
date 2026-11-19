import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { I18nContext } from '@nestjs/i18n';
import { PasswordHasher, TokenPair, TokenService } from '@nestjs/authentication';
import { AuthProviderEnum, LogoutTypeEnum, SignUpRoleEnum, SystemRoleEnum, DoctorVerificationStatus, OtpPurpose } from '../../dependencies/enum/index.js';
import { EmailDto, ForgotPasswordDto, GoogleSignInDto, LogoutDto, ResetPasswordDto, SignInDto, SignUpDto, VerifyEmailDto } from './dto/index.js';
import { CreateDoctorProfileCommand, CreateUserCommand, UpdateUserCommand } from './cqrs/command/index.js';
import { FindUserByEmailQuery, FindUserByGoogleIdQuery, IsLicenseTakenQuery } from './cqrs/query/index.js';
import { AuthenticationEntity, toAuthenticationEntity } from './entity/index.js';
import {
  AuthenticateEmailVerificationRequestedEvent,
  AuthenticatePasswordResetRequestedEvent,
  AuthenticateRegisteredEvent,
  EMAIL_VERIFICATION_REQUESTED_EVENT,
  PASSWORD_RESET_REQUESTED_EVENT,
  USER_REGISTERED_EVENT,
} from './event/index.js';
import { LoggerService, NotificationService, OtpService, GoogleIdentityService, type GoogleProfile } from '../../dependencies/service/index.js';
import { EnsurePatientRecordCommand } from '../patient/cqrs/command/index.js';
import type { HUserDocument } from '../../database/model/index.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly googleIdentityService: GoogleIdentityService,
    private readonly notificationService: NotificationService,
    private readonly i18nContext: I18nContext,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async signUp(data: SignUpDto): Promise<AuthenticationEntity> {
    try {
      const user = await this.queryBus.execute(new FindUserByEmailQuery(data.email));

      if (user) throw new ConflictException('An account with this email already exists');
      const isDoctor = data.role === SignUpRoleEnum.DOCTOR;

      if (isDoctor && (await this.queryBus.execute(new IsLicenseTakenQuery(data.licenseNumber!))))
        throw new ConflictException('This license number is already registered');
      const passwordHash = await this.passwordHasher.hash(data.password);

      const createdUser = await this.commandBus.execute(
        new CreateUserCommand({
          name: data.name,
          email: data.email,
          city: data.city,
          passwordHash,
          role: isDoctor ? SystemRoleEnum.DOCTOR : SystemRoleEnum.PATIENT,
          doctorStatus: isDoctor ? DoctorVerificationStatus.PENDING : null,
          provider: AuthProviderEnum.SYSTEM,
          consentAcceptedAt: data.acceptTerms ? new Date() : null,
          language: this.i18nContext.locale,
        }),
      );

      if (isDoctor) {
        await this.commandBus.execute(
          new CreateDoctorProfileCommand(createdUser._id, {
            clinicName: data.clinicName!,
            clinicAddress: data.clinicAddress!,
            specialty: data.specialty,
            licenseNumber: data.licenseNumber,
          }),
        );
      } else {
        await this.commandBus.execute(new EnsurePatientRecordCommand(createdUser._id));
      }

      this.eventEmitter.emit(USER_REGISTERED_EVENT, new AuthenticateRegisteredEvent(createdUser._id.toString(), createdUser.email, this.i18nContext.locale));
      return toAuthenticationEntity(createdUser);
    } catch (error) {
      this.loggerService.warn(error);
      throw error;
    }
  }

  async signIn(data: SignInDto): Promise<TokenPair> {
    try {
      const user = await this.queryBus.execute(new FindUserByEmailQuery(data.email));
      if (!user) throw new NotFoundException();

      if (!user.emailVerifiedAt) throw new ConflictException('Email address is not verified');
      const valid = await this.passwordHasher.verify(data.password, user?.passwordHash);

      if (!user || !valid) throw new UnauthorizedException('Invalid email or password');
      if (user.isActive === false) throw new ForbiddenException('This account has been disabled');

      const tokens = await this.tokenService.issue(user._id.toString());

      return tokens;
    } catch (error) {
      this.loggerService.warn(error);
      throw error;
    }
  }

  async logout(userId: string, data: LogoutDto): Promise<void> {
    try {
      switch (data.type) {
        case LogoutTypeEnum.SINGLE:
          await this.tokenService.revoke(data.refreshToken!);
          if (data.deviceToken) await this.notificationService.unregisterDevice(userId, data.deviceToken);
          break;
        case LogoutTypeEnum.ALL:
          await this.tokenService.revokeAll(userId);
          await this.notificationService.unregisterAllDevices(userId);
          break;
      }
    } catch (error) {
      this.loggerService.warn(error);
      throw error;
    }
  }

  sendVerifyEmail({ email }: EmailDto): void {
    void (async () => {
      const user = await this.queryBus.execute(new FindUserByEmailQuery(email));
      if (!user || user.emailVerifiedAt) return;
      this.eventEmitter.emit(EMAIL_VERIFICATION_REQUESTED_EVENT, new AuthenticateEmailVerificationRequestedEvent(user._id.toString(), user.email));
    })().catch((error: unknown) => this.loggerService.warn(error));
  }

  async verifyEmail({ email, code }: VerifyEmailDto): Promise<void> {
    const valid = await this.otpService.verify(OtpPurpose.EMAIL_VERIFICATION, email, code);
    if (!valid) throw new BadRequestException('Invalid or expired verification code');
    await this.commandBus.execute(new UpdateUserCommand({ email, emailVerifiedAt: null }, { $set: { emailVerifiedAt: new Date() } }));
  }

  forgotPassword({ email }: ForgotPasswordDto): void {
    void (async () => {
      const user = await this.queryBus.execute(new FindUserByEmailQuery(email));
      if (user) this.eventEmitter.emit(PASSWORD_RESET_REQUESTED_EVENT, new AuthenticatePasswordResetRequestedEvent(user._id.toString(), user.email));
    })().catch((error: unknown) => this.loggerService.warn(error));
  }

  async resetPassword({ email, code, password }: ResetPasswordDto): Promise<void> {
    const valid = await this.otpService.verify(OtpPurpose.PASSWORD_RESET, email, code);
    if (!valid) throw new BadRequestException('Invalid or expired verification code');
    const user = await this.queryBus.execute(new FindUserByEmailQuery(email));
    if (!user) throw new BadRequestException('Invalid or expired verification code');

    const passwordHash = await this.passwordHasher.hash(password);
    await this.commandBus.execute(new UpdateUserCommand({ _id: user._id }, { $set: { passwordHash, emailVerifiedAt: user.emailVerifiedAt ?? new Date() } }));
    await this.tokenService.revokeAll(user._id.toString());
  }

  async googleSignIn({ idToken, city }: GoogleSignInDto): Promise<{ created: boolean; tokens: TokenPair }> {
    const profile = await this.googleIdentityService.verify(idToken);
    if (!profile.emailVerified) throw new UnauthorizedException('Invalid Google credential');

    const { user, created } = await this.resolveGoogleUser(profile, city);
    if (user.isActive === false) throw new ForbiddenException('This account has been disabled');
    const tokens = await this.tokenService.issue(user._id.toString(), { method: 'google' });
    return { created, tokens };
  }

  private async resolveGoogleUser(profile: GoogleProfile, city?: string): Promise<{ user: HUserDocument; created: boolean }> {
    const linked = await this.queryBus.execute(new FindUserByGoogleIdQuery(profile.subject));
    if (linked) return { user: linked, created: false };

    const existing = await this.queryBus.execute(new FindUserByEmailQuery(profile.email));
    if (!existing) {
      if (!city) throw new BadRequestException('City is required to create an account');

      const user = await this.commandBus.execute(
        new CreateUserCommand({
          name: profile.name ?? profile.email.split('@')[0],
          email: profile.email,
          city,
          avatarUrl: profile.picture,
          googleId: profile.subject,
          role: SystemRoleEnum.PATIENT,
          provider: AuthProviderEnum.GOOGLE,
          emailVerifiedAt: new Date(),
          language: this.i18nContext.locale,
        }),
      );
      await this.commandBus.execute(new EnsurePatientRecordCommand(user._id));
      return { user, created: true };
    }

    if (existing.googleId) throw new ConflictException('An account with this email or Google account already exists');
    if (!existing.emailVerifiedAt) throw new ForbiddenException('Verify your email address before signing in with Google');

    const updated = await this.commandBus.execute(new UpdateUserCommand({ _id: existing._id, googleId: null }, { $set: { googleId: profile.subject } }));
    if (!updated) throw new ConflictException('An account with this email or Google account already exists');
    return { user: updated, created: false };
  }
}
