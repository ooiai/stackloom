/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
"use client"

export const enum BizErrorCode {
  VALIDATION_ERROR = 400001,
  UNAUTHORIZED = 400002,
  FORBIDDEN = 400003,
  NOT_FOUND = 400004,
  CONFLICT = 400005,
  BIZ_CLIENT_ERROR = 400006,
  BIZ_DATA_ERROR = 400007,
  TOKEN_EXPIRED = 400008,
  DB_ERROR = 500001,
  REDIS_ERROR = 500002,
  MQ_ERROR = 500003,
  EXTERNAL_ERROR = 500004,
  INTERNAL_ERROR = 500000,
  UNPROCESSABLE_ENTITY = 400100, // Business validation errors
  RATE_LIMIT = 400101, // Rate limiting errors
  EASTER_EGG = 400102, // Easter egg responses

  // Data existence errors (410000-410099)
  DATA_EXISTS = 410000, // Data already exists
  DATA_DUPLICATE = 410001, // Duplicate entry found
  DATA_NOT_FOUND = 410002, // Data not found/doesn't exist
  DATA_DELETED = 410003, // Data has been deleted
  DATA_ARCHIVED = 410004, // Data is archived
  DATA_OUTDATED = 410005, // Data version is outdated
}

export const enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  TOKEN_EXPIRED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  EXPECTATION_FAILED = 417,
  INTERNAL_SERVER_ERROR = 500,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  IM_A_TEAPOT = 418,
}

export const enum ClientStatusCode {
  THROTTLE_ERROR = 20001,
}
