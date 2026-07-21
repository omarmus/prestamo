import type { AdminApplicationDetail } from '@prestamos/shared';

export const ADMIN_QUERY = Symbol('ADMIN_QUERY');

export interface AdminQuery {
  getApplicationDetail(applicationId: string): Promise<AdminApplicationDetail | null>;
}
