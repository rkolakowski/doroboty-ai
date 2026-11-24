import { z } from "zod";

const questionKinds = ["screening", "contribution"] as const;
export const maxApplicationQuestions = 10;
// Existing offers and submissions may contain up to twelve questions.
const maxStoredQuestions = 12;
export const maxPromptLength = 200;
export const maxResponseLength = 12000;
export const maxOptions = 10;

export const questionSchema = z.object({
  kind: z.enum(questionKinds),
  prompt: z.string().trim().min(1).max(maxPromptLength),
  options: z
    .array(z.string().trim().min(1).max(maxPromptLength))
    .min(2)
    .max(maxOptions)
    .refine((options) => new Set(options).size === options.length)
    .optional(),
});
export const responseSchema = questionSchema.extend({
  response: z.string().trim().max(maxResponseLength),
});
export type ApplicationQuestion = z.infer<typeof questionSchema>;
export type QuestionResponse = z.infer<typeof responseSchema>;

export function questionKey({ kind, prompt }: ApplicationQuestion) {
  return `${kind}:${prompt}`;
}

export const questionsSchema = z
  .array(questionSchema)
  .max(maxStoredQuestions)
  .refine((rows) => new Set(rows.map(questionKey)).size === rows.length);
export const questionResponsesSchema = z.array(responseSchema).max(maxStoredQuestions);
