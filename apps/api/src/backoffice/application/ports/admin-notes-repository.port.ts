export const ADMIN_NOTES_REPOSITORY = Symbol('ADMIN_NOTES_REPOSITORY');

export interface AdminNoteRecord {
  id: string;
  authorId: string;
  authorName: string;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotesRepository {
  create(data: {
    authorId: string;
    entityType: string;
    entityId: string;
    content: string;
  }): Promise<AdminNoteRecord>;
  findByEntity(entityType: string, entityId: string): Promise<AdminNoteRecord[]>;
}
