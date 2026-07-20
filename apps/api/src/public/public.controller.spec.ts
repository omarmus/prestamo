import { Test, TestingModule } from '@nestjs/testing';
import { PublicController } from './public.controller';

describe('PublicController', () => {
  let controller: PublicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
    }).compile();

    controller = module.get<PublicController>(PublicController);
  });

  it('should calculate loan and return LoanResult', () => {
    const result = controller.calculate({
      amount: 10000,
      termMonths: 12,
      annualRate: 12,
    });
    expect(result).toHaveProperty('monthlyPayment');
    expect(result).toHaveProperty('totalInterest');
    expect(result).toHaveProperty('totalPayment');
    expect(result).toHaveProperty('schedule');
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[result.schedule.length - 1].balance).toBe(0);
  });
});
