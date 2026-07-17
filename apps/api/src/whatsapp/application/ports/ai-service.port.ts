export interface AIServicePort {
  classifyIntent(
    message: string,
    history: unknown[],
  ): Promise<{ intent: string; reply: string } | null>;
}
