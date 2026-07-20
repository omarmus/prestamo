import {Inject, Controller, Get, Post, Body, UseGuards, HttpCode} from '@nestjs/common';
import type { CreateDocumentInput } from '@prestamos/shared';
import { CreateDocumentSchema } from '@prestamos/shared';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import type { JwtPayload } from '@prestamos/shared';

import { ListDocumentsHandler } from '../application/document/list-documents.handler';
import { UploadDocumentHandler } from '../application/document/upload-document.handler';

@Controller('api/customers/me/documents')
@UseGuards(JwtAuthGuard)
export class CustomerDocumentController {
  constructor(
    @Inject(ListDocumentsHandler)
    private readonly listDocumentsHandler: ListDocumentsHandler,
    @Inject(UploadDocumentHandler)
    private readonly uploadDocumentHandler: UploadDocumentHandler,
  ) {}

  @Get()
  listDocuments(@CurrentUser() user: JwtPayload) {
    return this.listDocumentsHandler.execute(user.sub);
  }

  @Post()
  @HttpCode(201)
  uploadDocument(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateDocumentSchema)) body: CreateDocumentInput,
  ) {
    return this.uploadDocumentHandler.execute(user.sub, body);
  }
}
