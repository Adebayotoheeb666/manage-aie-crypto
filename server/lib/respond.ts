import type { Response } from "express";

export function formatErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;

  try {
    // Try common error shapes first
    if (err.message && typeof err.message === "string") return err.message;
    if (err.error && typeof err.error === "string") return err.error;

    // If the error has a code property (Supabase style errors)
    if (err.code && typeof err.code === "string") return err.code;

    // For complex objects, create a safe copy excluding problematic properties
    // that might contain non-serializable values like Response objects or streams
    const safeError: Record<string, any> = {};
    const excludeKeys = new Set([
      "response",
      "request",
      "body",
      "statusText",
      "headers",
      "config",
      "stack",
      "toJSON", // functions
    ]);

    for (const [key, value] of Object.entries(err)) {
      // Skip excluded keys
      if (excludeKeys.has(key)) continue;

      // Skip functions
      if (typeof value === "function") continue;

      // Skip circular references and non-serializable objects
      if (value === null || typeof value === "undefined") {
        safeError[key] = value;
      } else if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        safeError[key] = value;
      } else if (Array.isArray(value)) {
        // For arrays, filter out problematic items
        safeError[key] = value.filter(
          (item) =>
            item !== null &&
            typeof item !== "function" &&
            typeof item !== "object"
        );
      } else if (typeof value === "object") {
        // For nested objects, try to extract simple properties
        try {
          if ("message" in value && typeof value.message === "string") {
            safeError[key] = value.message;
          } else if ("code" in value && typeof value.code === "string") {
            safeError[key] = value.code;
          }
        } catch (e) {
          // Skip this property if we can't safely access it
        }
      }
    }

    // If we built a safe object with data, stringify it
    if (Object.keys(safeError).length > 0) {
      return JSON.stringify(safeError);
    }

    // Fallback to simple string representation
    return String(err);
  } catch (e) {
    // If all else fails, convert to string
    return String(err);
  }
}

export function serverError(res: Response, err: any, status: number = 500) {
  const message = formatErrorMessage(err) || "Unknown error";
  return res.status(status).json({ error: message });
}

export function clientError(
  res: Response,
  message: string,
  status: number = 400,
) {
  return res.status(status).json({ error: message });
}
