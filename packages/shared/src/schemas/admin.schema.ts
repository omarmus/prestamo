import { z } from 'zod';

export const CreateNoteSchema = z.object({
  entityType: z.enum(['CUSTOMER', 'LOAN', 'APPLICATION']),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const CreateAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+591[67]\d{7}$/),
  password: z.string().min(8),
});

export const AdminCustomerListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminNotesQuerySchema = z.object({
  entityType: z.enum(['CUSTOMER', 'LOAN', 'APPLICATION']),
  entityId: z.string().uuid(),
});
