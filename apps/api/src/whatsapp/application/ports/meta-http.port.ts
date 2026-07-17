export interface MetaHttpPort {
  sendMessage(to: string, text: string): Promise<{ metaId: string }>;
}
