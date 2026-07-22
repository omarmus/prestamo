import { GetNotesHandler } from './get-notes.handler';
import type { AdminNotesRepository, AdminNoteRecord } from './ports/admin-notes-repository.port';

describe('GetNotesHandler', () => {
  let handler: GetNotesHandler;
  let mockRepo: jest.Mocked<AdminNotesRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByEntity: jest.fn(),
    };
    handler = new GetNotesHandler(mockRepo);
  });

  describe('scenario: notes exist for entity', () => {
    it('returns notes list', async () => {
      const notes: AdminNoteRecord[] = [
        {
          id: 'note-1',
          authorId: 'user-1',
          authorName: 'Admin',
          entityType: 'CUSTOMER',
          entityId: 'cust-1',
          content: 'Note 1',
          createdAt: '2026-07-21T00:00:00.000Z',
          updatedAt: '2026-07-21T00:00:00.000Z',
        },
      ];
      mockRepo.findByEntity.mockResolvedValue(notes);

      const result = await handler.execute('CUSTOMER', 'cust-1');

      expect(result.data).toEqual(notes);
      expect(mockRepo.findByEntity).toHaveBeenCalledWith('CUSTOMER', 'cust-1');
    });
  });

  describe('scenario: no notes for entity', () => {
    it('returns empty list', async () => {
      mockRepo.findByEntity.mockResolvedValue([]);

      const result = await handler.execute('LOAN', 'loan-1');

      expect(result.data).toHaveLength(0);
    });
  });
});
