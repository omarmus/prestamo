import { Injectable, Inject } from '@nestjs/common';
import { ADMIN_NOTES_REPOSITORY } from './ports/admin-notes-repository.port';
import type { AdminNotesRepository, AdminNoteRecord } from './ports/admin-notes-repository.port';
import type { AdminNoteListResponse } from '@prestamos/shared';

@Injectable()
export class GetNotesHandler {
  constructor(
    @Inject(ADMIN_NOTES_REPOSITORY) private readonly repo: AdminNotesRepository,
  ) {}

  async execute(entityType: string, entityId: string): Promise<AdminNoteListResponse> {
    const notes: AdminNoteRecord[] = await this.repo.findByEntity(entityType, entityId);
    return { data: notes };
  }
}
