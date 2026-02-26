export class ApiSuccess {
  success: boolean;
  data: any;
  message: string;

  constructor(data: any, message: string) {
    this.success = true;
    this.data = data;
    this.message = message;
  }
}

export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  constructor(statusCode: number, errorCode: string,message: string,) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    // This captures the stack trace but keeps the class clean
    Error.captureStackTrace(this, this.constructor);
  }
}
