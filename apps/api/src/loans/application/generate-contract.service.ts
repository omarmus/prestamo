import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRACT_TEMPLATE_REGISTRY,
  CONTRACT_STORAGE_SERVICE,
  GENERATED_DOCUMENT_REPOSITORY,
} from '../loans.tokens';
import type { ContractTemplateRegistry } from './contract-templates/contract-template-registry';
import type { ContractTemplateData } from './contract-templates/loan-contract.template';
import type { ContractStorageService } from '../infrastructure/storage/contract-storage.service';
import type { GeneratedDocumentRepository } from '../domain/generated-document.repository';

export interface GenerateContractInput {
  loanId: string;
  templateType: string;
  data: ContractTemplateData;
}

export interface GenerateContractResult {
  id: string;
  loanId: string;
  type: string;
  filePath: string;
  mimeType: string;
  createdAt: Date;
}

@Injectable()
export class GenerateContractService {
  constructor(
    @Inject(CONTRACT_TEMPLATE_REGISTRY)
    private readonly registry: ContractTemplateRegistry,
    @Inject(CONTRACT_STORAGE_SERVICE)
    private readonly storage: ContractStorageService,
    @Inject(GENERATED_DOCUMENT_REPOSITORY)
    private readonly docRepo: GeneratedDocumentRepository,
  ) {}

  async execute(input: GenerateContractInput): Promise<GenerateContractResult> {
    const builder = this.registry.get(input.templateType);
    if (!builder) {
      throw new Error(`Unknown template type: ${input.templateType}`);
    }

    const pdfBuffer = await builder(input.data);
    const fileName = `contrato-${input.loanId}.pdf`;
    const filePath = await this.storage.save(input.loanId, pdfBuffer, fileName);

    const doc = await this.docRepo.save({
      loanId: input.loanId,
      type: input.templateType,
      filePath,
      mimeType: 'application/pdf',
      metadata: null,
    });

    return {
      id: doc.id,
      loanId: doc.loanId,
      type: doc.type,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt,
    };
  }
}
