import type { Response } from "express";

export function formatErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    // Try common error shapes
    if (err.message && typeof err.message === "string") return err.message;
    if (err.error && typeof err.error === "string") return err.error;
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
}

export function serverError(res: Response, err: any, status: number = 500) {
  const message = formatErrorMessage(err) || "Unknown error";
  return res.status(status).json({ error: message });
}

export function clientError(res: Response, message: string, status: number = 400) {
  return res.status(status).json({ error: message });
}
