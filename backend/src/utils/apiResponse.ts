export class ApiSuccess {
  success: boolean;
  data: any;
  message: string;

  constructor(success: boolean, data: any, message: string) {
    this.success = success;
    this.data = data;
    this.message = message;
  }
}

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
