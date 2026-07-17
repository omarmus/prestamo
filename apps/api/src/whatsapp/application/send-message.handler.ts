import type { MetaHttpPort } from './ports/meta-http.port';

export class SendMessageHandler {
  constructor(private readonly metaHttp: MetaHttpPort) {}

  async execute(to: string, text: string): Promise<{ metaId: string }> {
    return this.metaHttp.sendMessage(to, text);
  }
}
