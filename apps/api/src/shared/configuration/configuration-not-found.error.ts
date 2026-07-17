export class ConfigurationNotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(key: string) {
    super(`Configuration key "${key}" not found`);
    this.name = 'ConfigurationNotFoundError';
  }
}
