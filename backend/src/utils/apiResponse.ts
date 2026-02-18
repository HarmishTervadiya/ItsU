export class ApiSuccess {
  success: boolean;
  data: any;
  message: string;

  constructor(data: any, message: string) {
    Object.assign(this, data);
    this.success = true;
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
