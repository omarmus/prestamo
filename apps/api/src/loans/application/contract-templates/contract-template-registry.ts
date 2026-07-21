import type { ContractTemplateData } from './loan-contract.template';

export type TemplateBuilder = (data: ContractTemplateData) => Promise<Buffer>;

// ponytail: Simple Map-based registry. Add persistence when template types become dynamic.
export class ContractTemplateRegistry {
  private readonly templates = new Map<string, TemplateBuilder>();

  register(name: string, builder: TemplateBuilder): void {
    this.templates.set(name, builder);
  }

  get(name: string): TemplateBuilder | undefined {
    return this.templates.get(name);
  }

  has(name: string): boolean {
    return this.templates.has(name);
  }
}
