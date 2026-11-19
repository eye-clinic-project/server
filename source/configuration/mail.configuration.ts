import { ConfigService } from '@nestjs/config';
import { SmtpTransport, type MailModuleOptions } from '@nestjs/mail';

export function createMailOptions(config: ConfigService): MailModuleOptions {
  const user = config.getOrThrow<string>('app.mail.email');
  return {
    transport: new SmtpTransport({
      host: config.getOrThrow<string>('app.mail.host'),
      port: config.getOrThrow<number>('app.mail.port'),
      auth: { user, pass: config.getOrThrow<string>('app.mail.password') },
    }),
    from: `${config.get<string>('app.name') ?? 'RetinaCare'} <${user}>`,
  };
}
