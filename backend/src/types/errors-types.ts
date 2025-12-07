import z from "zod";

export const zodIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
  code: z.string(),
});

export const zodErrorSchema = z.object({
  message: z.string(),
  errors: z.array(zodIssueSchema),
});

export const appErrorSchema = z.object({
  message: z.string(),
  code: z.number(),
});
