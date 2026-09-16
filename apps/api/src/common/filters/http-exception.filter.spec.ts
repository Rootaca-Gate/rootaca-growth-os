import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  const createHost = () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = { url: '/api/example' };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;

    return { host, response };
  };

  it('maps HttpException to a consistent error body', () => {
    const { host, response } = createHost();

    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/api/example',
        message: 'Not found',
      }),
    );
  });

  it('returns the unexpected error message', () => {
    const { host, response } = createHost();

    filter.catch(new Error('database exploded'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'database exploded',
      }),
    );
  });
});
