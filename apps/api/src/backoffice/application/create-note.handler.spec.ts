import { CreateNoteHandler } from './create-note.handler';
import type { AdminNotesRepository, AdminNoteRecord } from './ports/admin-notes-repository.port';

describe('CreateNoteHandler', () => {
  let handler: CreateNoteHandler;
  let mockRepo: jest.Mocked<AdminNotesRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByEntity: jest.fn(),
    };
    handler = new CreateNoteHandler(mockRepo);
  });

  describe('scenario: create a note', () => {
    it('creates and returns the note', async () => {
      const record: AdminNoteRecord = {
        id: 'note-1',
        authorId: 'user-1',
        authorName: 'Admin User',
        entityType: 'CUSTOMER',
        entityId: 'cust-1',
        content: 'Test note content',
        createdAt: '2026-07-21T00:00:00.000Z',
        updatedAt: '2026-07-21T00:00:00.000Z',
      };
      mockRepo.create.mockResolvedValue(record);

      const result = await handler.execute({
        authorId: 'user-1',
        entityType: 'CUSTOMER',
        entityId: 'cust-1',
        content: 'Test note content',
      });

      expect(result).toEqual(record);
      expect(mockRepo.create).toHaveBeenCalledWith({
        authorId: 'user-1',
        entityType: 'CUSTOMER',
        entityId: 'cust-1',
        content: 'Test note content',
      });
    });
  });
});
