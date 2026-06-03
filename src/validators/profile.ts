import { z } from "zod";

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(1, "Имя пользователя обязательно")
    .max(50, "Имя пользователя не должно превышать 50 символов"),
  email: z
    .string()
    .email("Неверный формат email")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Неверный формат URL")
    .optional()
    .or(z.literal("")),
});

// Inferred types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
