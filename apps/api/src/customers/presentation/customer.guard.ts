import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../customers.tokens';
import type { CustomerRepository } from '../domain/customer.repository';
import type { JwtPayload } from '@prestamos/shared';

/**
 * Guard that ensures the authenticated user has an associated Customer record.
 * Use on routes that require a fully registered customer profile.
 */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!request.user) {
      return false;
    }
    const customer = await this.customerRepository.findByUserId(request.user.sub);
    if (!customer) {
      return false;
    }
    // Attach customer to request for downstream use
    (request as Record<string, unknown>).customer = customer;
    return true;
  }
}
