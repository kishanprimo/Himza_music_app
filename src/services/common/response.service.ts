export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
}

import { Response } from 'express';

const StatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Standard Response Messages
const ResponseMessages = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  BAD_REQUEST: 'Invalid request parameters',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
} as const;

const generalResponse = <T>(
  res: Response,
  success: boolean,
  message: string = ResponseMessages.SUCCESS,
  statusCode: number = 200,
  data?: T
): Response<ApiResponse<T>> => {
  return res.status(statusCode).send({
    success,
    message,
    data,
  });
};

const successResponse = <T>(
  res: Response,
  message: string = ResponseMessages.SUCCESS,
  data?: T
): Response<ApiResponse<T>> => {
  return generalResponse(res, true, message, StatusCodes.OK, data);
};

const createdResponse = <T>(
  res: Response,
  message: string = ResponseMessages.CREATED,
  data?: T
): Response<ApiResponse<T>> => {
  return generalResponse(res, true, message, StatusCodes.CREATED, data);
};

const badRequestResponse = (
  res: Response,
  message: string = ResponseMessages.BAD_REQUEST
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.BAD_REQUEST);
};

const unauthorizedResponse = (
  res: Response,
  message: string = ResponseMessages.UNAUTHORIZED
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.UNAUTHORIZED);
};

const forbiddenResponse = (
  res: Response,
  message: string = ResponseMessages.FORBIDDEN
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.FORBIDDEN);
};

const notFoundResponse = (
  res: Response,
  message: string = ResponseMessages.NOT_FOUND
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.NOT_FOUND);
};

const conflictResponse = (
  res: Response,
  message: string = ResponseMessages.CONFLICT
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.CONFLICT);
};

const validationErrorResponse = (
  res: Response,
  message: string = ResponseMessages.VALIDATION_ERROR
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.UNPROCESSABLE_ENTITY);
};

const internalServerErrorResponse = (
  res: Response,
  message: string = ResponseMessages.INTERNAL_ERROR
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.INTERNAL_SERVER_ERROR);
};

const serviceUnavailableResponse = (
  res: Response,
  message: string = ResponseMessages.SERVICE_UNAVAILABLE
): Response<ApiResponse> => {
  return generalResponse(res, false, message, StatusCodes.SERVICE_UNAVAILABLE);
};

export default {
  StatusCodes,
  ResponseMessages,
  generalResponse,
  successResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  internalServerErrorResponse,
  serviceUnavailableResponse
}