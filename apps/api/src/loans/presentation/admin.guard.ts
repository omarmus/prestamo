import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@prestamos/shared';

// ponytail: Basic role check. Add RBAC granular when more roles emerge.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user?.role === 'ADMIN';
  }
}
