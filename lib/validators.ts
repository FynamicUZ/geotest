import { z } from "zod";

export const choiceSchema = z.object({
  text: z.string().min(1, "Choice text required"),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  prompt: z.string().min(1, "Question prompt required"),
  imageUrl: z.string().url().optional().nullable(),
  explanation: z.string().optional().nullable(),
  choices: z
    .array(choiceSchema)
    .min(2, "At least 2 choices required")
    .refine(
      (cs) => cs.filter((c) => c.isCorrect).length === 1,
      "Exactly one choice must be marked correct"
    ),
});

export const testPayloadSchema = z.object({
  name: z.string().min(1, "Test name required").max(200),
  description: z.string().max(2000).optional().default(""),
  timeLimitSec: z.number().int().positive().nullable().optional(),
  questions: z.array(questionSchema).min(1, "At least 1 question required"),
});

export type TestPayload = z.infer<typeof testPayloadSchema>;
export type QuestionPayload = z.infer<typeof questionSchema>;

export const credentialsSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(40)
    .regex(/^[A-Za-z0-9_.-]+$/, "Only letters, digits, _ . -"),
  password: z.string().min(4, "Password must be at least 4 characters").max(200),
});

export const createTestRequestSchema = z.object({
  username: credentialsSchema.shape.username,
  password: credentialsSchema.shape.password,
  test: testPayloadSchema,
});

export const editTestRequestSchema = createTestRequestSchema;

export const deleteTestRequestSchema = credentialsSchema;

export const submitSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname required")
    .max(40)
    .regex(/^[A-Za-z0-9_. -]+$/, "Letters, digits, _ . - and spaces"),
  durationSec: z.number().int().nonnegative().max(86400).optional().default(0),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        choiceId: z.string().nullable(),
      })
    )
    .min(1),
  practice: z.boolean().optional().default(false),
});
