import type { ZodError } from "zod";
import { z } from "zod";

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = {};

/** An error whose message is safe to show to the user. */
export class UserError extends Error {}

export function fromZodError(error: ZodError): ActionState {
  const flat = z.flattenError(error);
  return {
    error: flat.formErrors[0] ?? "Please fix the highlighted fields.",
    fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
  };
}

function databaseHint(err: unknown): string | null {
  const parts: string[] = [];
  let cur: unknown = err;
  for (let i = 0; i < 4 && cur; i++) {
    if (cur instanceof Error) {
      parts.push(cur.message);
      cur = "cause" in cur ? (cur as { cause?: unknown }).cause : undefined;
      continue;
    }
    if (typeof cur === "object" && cur && "message" in cur) {
      parts.push(String((cur as { message: unknown }).message));
    }
    break;
  }
  const text = parts.join("\n").toLowerCase();
  if (
    text.includes("does not exist") ||
    text.includes("undefined_column") ||
    text.includes("42703") ||
    (text.includes("column") && text.includes("photo_reading"))
  ) {
    return "The database is missing a migration. Run npm run db:migrate, then try again.";
  }
  return null;
}

export function toActionError(err: unknown): ActionState {
  if (err instanceof UserError) return { error: err.message };
  console.error(err);
  const hint = databaseHint(err);
  if (hint) return { error: hint };
  return { error: "Something went wrong. Please try again." };
}
