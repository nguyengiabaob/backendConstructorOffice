import { Response } from "express";

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  statusCode: number;
}

export class SuccessResponseBuilder<T = unknown> {
  private _message: string = "Operation successful";
  private _data?: T;
  private _meta?: SuccessResponse<T>["meta"];
  private _statusCode: number = 200;

  constructor(message?: string) {
    if (message) {
      this._message = message;
    }
  }

  static create<T = unknown>(message?: string): SuccessResponseBuilder<T> {
    return new SuccessResponseBuilder<T>(message);
  }

  message(message: string): this {
    this._message = message;
    return this;
  }

  data(data: T): this {
    this._data = data;
    return this;
  }

  meta(meta: SuccessResponse<T>["meta"]): this {
    this._meta = meta;
    return this;
  }

  pagination(page: number, limit: number, total: number): this {
    const totalPages = Math.ceil(total / limit);
    this._meta = {
      ...this._meta,
      pagination: { page, limit, total, totalPages },
    };
    return this;
  }

  statusCode(code: number): this {
    this._statusCode = code;
    return this;
  }

  send(res: Response): void {
    const response: SuccessResponse<T> = {
      success: true,
      message: this._message,
      statusCode: this._statusCode,
    };

    if (this._data !== undefined) {
      response.data = this._data;
    }

    if (this._meta) {
      response.meta = this._meta;
    }

    res.status(this._statusCode).json(response);
  }
}
