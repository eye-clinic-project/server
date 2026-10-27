import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLScalarType } from 'graphql';
import { GraphQLJSON } from '../src/common/graphql/json.scalar.js';
import { AppModule } from '../src/app.module.js';

describe('AppModule Bootstrap & Core Protocols (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    console.log('Is GraphQLJSON instanceof GraphQLScalarType?', GraphQLJSON instanceof GraphQLScalarType);
    console.log('GraphQLJSON constructor:', GraphQLJSON?.constructor?.name);
    console.log('GraphQLScalarType:', GraphQLScalarType?.name);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('HTTP: root endpoint responds', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.body).toEqual({
      message: 'request accepted',
      data: { message: 'hello from backend server' },
    });
  });

  it('GraphQL: schema compiles and introspection query works', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ __typename }' })
      .expect(200);

    expect(res.body.data).toEqual({ __typename: 'Query' });
  });
});
