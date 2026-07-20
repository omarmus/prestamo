import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';

/**
 * Catches domain errors that carry a `statusCode` property and returns
 * the appropriate HTTP response. Workaround until NestJS can map domain
 * exception types directly.
 */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = (exception as unknown as { statusCode?: number }).statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal server error';

    console.error('[DomainErrorFilter]', exception);
    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
