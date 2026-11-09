import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../source/app.module.js';

// Needs MongoDB + Redis from .env.test (NODE_ENV=test npm run test:e2e).
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ message: 'request accepted', data: { message: 'hello from backend side' } });
  });

  it('rejects protected routes without a token', () => {
    return request(app.getHttpServer()).get('/api/v1/patients').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
