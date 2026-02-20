import { Request } from "express";

export interface User {
  id: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
