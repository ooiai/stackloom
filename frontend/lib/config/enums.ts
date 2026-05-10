/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum STORAGE_ENUM {
  // TOKEN = "token",
  // REQUEST_TOKEN = "request_token",
  // FP = "fingerprint2",
  // AUTH = "auth",
  TOKEN = "token",
  REQUEST_TOKEN = "request_token",
  FP = "fingerprint2",
  AUTH = "auth",
  USER_ROLES = "user_roles",
  ADMIN_ROLES = "admin_roles",
}

export enum HTTP_REQUEST_ENUM {
  SCOPE = "TOPEDU_WEB",
  CLIENTID = "TOPEDU_WEB",
  BASIC_TAG = "topedu::basic",
  BASIC_AUTH = "topedu::auth",
  BASIC_REFRESH_TOKEN = "topedu::refresh_token",
}

export enum API_ENUM {
  REFRESH_TOKEN = "/apiv1/auth/signin/refresh_token",
}

export enum ROUTER_ENUM {
  HOME = "/",
  DASHBOARD = "/dashboard",
  MEMBER = "/member",
  SIGNIN = "/signin",
  SIGNUP = "/signup",
  PRICING = "/pricing",
}

export enum OSS_ENUM {
  IMAGES = "images",
}
