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

export function toActionError(err: unknown): ActionState {
  if (err instanceof UserError) return { error: err.message };
  console.error(err);
  return { error: "Something went wrong. Please try again." };
}
