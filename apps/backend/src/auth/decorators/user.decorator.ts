import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: number;
    sub: number;
    email: string;
    role: string;
  };
}

export const User = createParamDecorator(
  (
    data: keyof NonNullable<AuthenticatedRequest['user']> | 'id' | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
