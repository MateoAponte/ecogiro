import { API_PREFIX } from 'config/constants/prefix';
import 'dotenv/config';
import { ApiErrorResponse } from '../dto';

export const buildErrorResponseExample = (
  statusCode: number,
  message: string,
  path: string,
): ApiErrorResponse => {
  return {
    statusCode,
    message,
    path: `${API_PREFIX}/${path}`,
    timestamp: new Date().toISOString(),
  };
};
