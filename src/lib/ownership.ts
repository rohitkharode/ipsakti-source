import { AppError } from "@/lib/errors";

export function assertOwnership(ownerId: string | null | undefined, userId: string): void {
  if (!userId) throw new AppError("AUTH_REQUIRED", "Authentication is required.", false);
  if (!ownerId || ownerId !== userId) throw new AppError("SOURCE_NOT_FOUND", "The requested case was not found.", false);
}

export function ownedCaseInsert<T extends Record<string, unknown>>(record: T, userId: string): T & { user_id: string } {
  if (!userId) throw new AppError("AUTH_REQUIRED", "Authentication is required.", false);
  return { ...record, user_id: userId };
}
