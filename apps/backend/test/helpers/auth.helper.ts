import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

export interface AuthTokens {
  accessToken: string;
}

export async function registerUser(
  app: INestApplication<App>,
  userData: { name: string; email: string; password: string },
): Promise<{ status: number; body: unknown }> {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(userData)
    .expect(201);

  return { status: response.status, body: response.body };
}

export async function loginUser(
  app: INestApplication<App>,
  credentials: { email: string; password: string },
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(credentials)
    .expect(200);

  return {
    accessToken: (response.body as { accessToken: string }).accessToken,
  };
}

export async function registerAndLogin(
  app: INestApplication<App>,
  userData: { name: string; email: string; password: string },
): Promise<AuthTokens> {
  await registerUser(app, userData);
  return loginUser(app, { email: userData.email, password: userData.password });
}
