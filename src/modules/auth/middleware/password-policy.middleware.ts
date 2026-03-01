import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PasswordPolicyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const pwd: unknown = req.body?.password;
    if (pwd && typeof pwd === 'string') {
      const password = pwd as string;
      const minLength = 8;
      const hasUpper = /[A-Z]/.test(password);
      if (password.length < minLength || !hasUpper) {
        throw new BadRequestException(
          'Password must be at least 8 characters and contain an uppercase letter',
        );
      }
    }
    next();
  }
}
