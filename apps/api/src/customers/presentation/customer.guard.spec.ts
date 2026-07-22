import { CustomerGuard } from './customer.guard';
import type { CustomerRepository } from '../domain/customer.repository';
import type { ExecutionContext } from '@nestjs/common';
import { Customer } from '../domain/customer.entity';

describe('CustomerGuard', () => {
  let guard: CustomerGuard;
  let mockRepo: jest.Mocked<CustomerRepository>;
  let mockGetRequest: jest.Mock;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockGetRequest = jest.fn();
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({ getRequest: mockGetRequest }),
    } as unknown as jest.Mocked<ExecutionContext>;

    guard = new CustomerGuard(mockRepo);
  });

  it('returns true when customer exists and attaches to request', async () => {
    const customer = Customer.create({ userId: 'user-id', firstName: 'Juan', documentType: 'CI', documentNumber: '12345678' });
    const request: Record<string, unknown> = { user: { sub: 'user-id' } };
    mockGetRequest.mockReturnValue(request);
    mockRepo.findByUserId.mockResolvedValue(customer);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(request.customer).toBe(customer);
    expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-id');
  });

  it('returns false when no user on request', async () => {
    mockGetRequest.mockReturnValue({});

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
    expect(mockRepo.findByUserId).not.toHaveBeenCalled();
  });

  it('returns false when customer not found', async () => {
    mockGetRequest.mockReturnValue({ user: { sub: 'user-id' } });
    mockRepo.findByUserId.mockResolvedValue(null);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });
});
