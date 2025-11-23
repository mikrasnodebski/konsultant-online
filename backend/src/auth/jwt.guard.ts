import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers['authorization'];
    const cookieToken: string | undefined = req.cookies?.['auth_token'];
    const token =
      (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7)) ||
      cookieToken;
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }
    try {
      const payload = await this.jwt.verifyAsync(token);
      req.user = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


