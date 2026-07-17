import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigurationService } from './configuration.service';
import { ConfigurationNotFoundError } from './configuration-not-found.error';
import { PrismaService } from '../prisma/prisma.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let prisma: {
    systemConfiguration: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      systemConfiguration: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      prisma.systemConfiguration.findUnique.mockResolvedValue({
        key: 'test.key',
        value: 42,
      });

      const result = await service.get<number>('test.key');

      expect(result).toBe(42);
    });

    it('should return default when key does not exist and default is provided', async () => {
      prisma.systemConfiguration.findUnique.mockResolvedValue(null);

      const result = await service.get<boolean>('missing.key', false);

      expect(result).toBe(false);
    });

    it('should throw ConfigurationNotFoundError when key does not exist and no default', async () => {
      prisma.systemConfiguration.findUnique.mockResolvedValue(null);

      await expect(service.get('nonexistent.key')).rejects.toThrow(ConfigurationNotFoundError);
    });

    it('should cache value after first read', async () => {
      prisma.systemConfiguration.findUnique.mockResolvedValue({
        key: 'cached.key',
        value: 'cached-value',
      });

      await service.get('cached.key');
      await service.get('cached.key');

      // Only one DB call — second read comes from cache
      expect(prisma.systemConfiguration.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('set', () => {
    it('should upsert a configuration value', async () => {
      await service.set('test.key', { nested: true }, 'Test config', 'user-1');

      expect(prisma.systemConfiguration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'test.key' },
          create: expect.objectContaining({ key: 'test.key', value: { nested: true }, description: 'Test config' }),
          update: expect.objectContaining({ value: { nested: true }, description: 'Test config' }),
        }),
      );
    });

    it('should invalidate cache for the updated key', async () => {
      // Cache a value first
      prisma.systemConfiguration.findUnique.mockResolvedValue({
        key: 'cached.key',
        value: 'old-value',
      });

      await service.get('cached.key');

      // Update the key
      await service.set('cached.key', 'new-value');

      // Next read should hit DB again (cache was invalidated)
      prisma.systemConfiguration.findUnique.mockResolvedValue({
        key: 'cached.key',
        value: 'new-value',
      });

      await service.get('cached.key');

      expect(prisma.systemConfiguration.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
