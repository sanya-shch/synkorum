import * as z from "zod";

// bcrypt only uses the first 72 BYTES of the input, so anything longer is silently ignored.
// Reject it instead, so two different long passwords can never hash to the same value.
const MAX_PASSWORD_BYTES = 72;

const NewPassword = z
  .string()
  .min(8, { message: "Minimum 8 characters" })
  .refine((value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES, {
    message: "Password is too long (max 72 bytes)",
  });

export const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  // Not subject to the new-password policy: accounts created under the old rules (min 6)
  // must still be able to sign in. Just bound the size.
  password: z.string().min(1, { message: "Password required" }).max(256),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: NewPassword,
  inviteToken: z.string().optional(),
});

export const NewPasswordSchema = z.object({
  password: NewPassword,
});

export const ResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(60),
});

export const UpdateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1).max(60),
  imageUrl: z.string().url().optional().nullable(),
});

export const InviteMemberSchema = z.object({
  organizationId: z.string(),
  email: z.string().email({ message: "Please enter a valid email" }),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const CreateBoardShareLinkSchema = z.object({
  boardId: z.string(),
  expiresInDays: z.number().int().positive().optional(), // undefined = without expiration date
  canEdit: z.boolean().optional(), // undefined = editable (matches the existing default)
});

export const CreateBoardSchema = z.object({
  organizationId: z.string(),
  title: z.string().min(1).max(60),
  imageUrl: z.string().min(1),
});
