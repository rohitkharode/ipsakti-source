import type { ErrorCode, FailureState } from "@/types/domain";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly recoverable: boolean;

  constructor(code: ErrorCode, message: string, recoverable = true) {
    super(`${code}: ${message}`);
    this.name = "AppError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

export function failure(code: ErrorCode, message: string, recoverable = true): FailureState {
  return { code, message, recoverable };
}
