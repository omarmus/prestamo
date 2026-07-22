import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Inject,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CreateNoteSchema, AdminNotesQuerySchema } from '@prestamos/shared';
import type { CreateNoteInput } from '@prestamos/shared';
import type { JwtPayload } from '@prestamos/shared';
import { CreateNoteHandler } from '../application/create-note.handler';
import { GetNotesHandler } from '../application/get-notes.handler';

@Controller('api/admin/notes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminNotesController {
  constructor(
    @Inject(CreateNoteHandler) private readonly createHandler: CreateNoteHandler,
    @Inject(GetNotesHandler) private readonly listHandler: GetNotesHandler,
  ) {}

  @Post()
  @HttpCode(201)
  create(
    @Body(new ZodValidationPipe(CreateNoteSchema)) body: CreateNoteInput,
    @Req() req: { user: JwtPayload },
  ) {
    return this.createHandler.execute({
      authorId: req.user.sub,
      entityType: body.entityType,
      entityId: body.entityId,
      content: body.content,
    });
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(AdminNotesQuerySchema))
    query: { entityType: string; entityId: string },
  ) {
    return this.listHandler.execute(query.entityType, query.entityId);
  }
}
