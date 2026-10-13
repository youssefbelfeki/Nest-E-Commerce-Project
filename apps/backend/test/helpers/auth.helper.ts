import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface AuthTokens {
  accessToken: string;
}

export async function registerUser(
  app: INestApplication,
  userData: { name: string; email: string; password: string },
): Promise<{ status: number; body: any }> {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(userData)
    .expect(201);

  return { status: response.status, body: response.body };
}

export async function loginUser(
  app: INestApplication,
  credentials: { email: string; password: string },
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(credentials)
    .expect(200);

  return { accessToken: response.body.accessToken };
}

export async function registerAndLogin(
  app: INestApplication,
  userData: { name: string; email: string; password: string },
): Promise<AuthTokens> {
  await registerUser(app, userData);
  return loginUser(app, { email: userData.email, password: userData.password });
}
