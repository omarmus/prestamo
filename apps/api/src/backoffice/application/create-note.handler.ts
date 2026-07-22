import { Injectable, Inject } from '@nestjs/common';
import { ADMIN_NOTES_REPOSITORY } from './ports/admin-notes-repository.port';
import type { AdminNotesRepository, AdminNoteRecord } from './ports/admin-notes-repository.port';

@Injectable()
export class CreateNoteHandler {
  constructor(
    @Inject(ADMIN_NOTES_REPOSITORY) private readonly repo: AdminNotesRepository,
  ) {}

  async execute(params: {
    authorId: string;
    entityType: string;
    entityId: string;
    content: string;
  }): Promise<AdminNoteRecord> {
    return this.repo.create(params);
  }
}
