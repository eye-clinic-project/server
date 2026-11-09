import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './dependency/exception/all-exceptions.filter.js';
import { I18nValidationPipe } from '@nestjs/i18n';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
class Server {
  constructor() {}
  async bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.set('query parser', 'extended', 'trust proxy', 'loopback');
    const configuration = app.get(ConfigService);

    const swaggerConfig = new DocumentBuilder()
      .setTitle('DR Detection API')
      .setDescription(
        'REST API for authentication, patient and doctor profiles, fundus images, AI analyses, reviews, reports, appointments, chat, notifications and hardware. Every response is wrapped as { message, data }.',
      )
      .setVersion('1.0')
      .addGlobalParameters({
        name: 'Accept-Language',
        in: 'header',
        required: false,
        description:
          'Language of messages and errors: en (default) or ar. Also ?lang=ar or the x-lang header; a signed-in user\'s saved language (PATCH /users/me { lang }) wins over this header.',
        schema: { type: 'string', enum: ['en', 'ar'] },
      })
      .addTag("Authentication", "Sign up, email verification, login (email/password or Google), tokens and passwords. Access tokens last 15 minutes; send them as `Authorization: Bearer <token>`.")
      .addTag("Users", "The signed-in user's account, profile picture and account deletion.")
      .addTag("Doctors", "Doctor profiles, doctor search and the doctor dashboard.")
      .addTag("Patients", "Patient records, search by name/email/patient ID, and a patient's analyses, reports and history. Doctors only see patients actively assigned to them.")
      .addTag("Doctor-Patient assignment", "Links between doctors and patients. Only an active assignment gives a doctor access to a patient's data.")
      .addTag("Fundus images", "Upload and view retinal (fundus) images. JPEG/PNG only; files are encrypted at rest.")
      .addTag("Analyses (AI)", "Two-stage AI analysis of a fundus image: DR detection, 5-level severity grade, confidence and Grad-CAM. AI_MODE controls whether the AI service is disabled, mocked or remote.")
      .addTag("Doctor reviews", "The doctor's confirmation or correction of an AI result, with notes, recommendations and follow-up date.")
      .addTag("Medical reports", "Reports generated from an analysis, sent to the patient and downloadable as PDF.")
      .addTag("Appointments", "Booking, rescheduling, confirming, cancelling and completing appointments using doctor availability slots.")
      .addTag("Doctor availability", "Time slots a doctor offers for appointments.")
      .addTag("Chat", "Doctor–patient messaging over REST and Socket.IO. Connect with `io(API_URL, { auth: { token } })`. Client → server: join_conversation, leave_conversation, send_message, typing, mark_read ({ conversationId, ... }, ack { ok, data | error }). Server → client: receive_message, message_read, typing, conversation_updated, notification, capture_session_updated.")
      .addTag("Notifications", "In-app notifications (also pushed live over Socket.IO as `notification`).")
      .addTag("Hardware (doctor)", "Register fundus cameras and start capture sessions for patients.")
      .addTag("Hardware (device)", "Endpoints called by the fundus camera itself, authenticated with the `x-device-key` header.")
      .addTag("Admin", "System statistics and user management. Admin role only.")
      .addTag("System", "Health checks, AI service status and signed file URLs.")
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'bearerAuth',
      )
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      jsonDocumentUrl: 'api/docs-json',
    });
    const port = configuration.getOrThrow<number>('app.port');
    app.enableCors({
      origin: configuration.get<string[]>('app.corsOrigin'),
      credentials: true,
      // Lets the browser client read how long a rate-limit block lasts (429 responses).
      exposedHeaders: ['Retry-After'],
    });
    app.disable('x-powered-by');
    app.enableShutdownHooks();
    app.useStaticAssets(join(process.cwd(), 'assets'), { prefix: '/assets/' });
    app.useGlobalPipes(
      // Same as ValidationPipe, with messages translated to the request's language.
      new I18nValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    await app.listen(port ?? 3000);
  }
}

const server = new Server();
await server.bootstrap();
