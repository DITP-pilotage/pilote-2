import { z } from 'zod';

export const validationCreationTokenAPI =
  z.object({
    email: z.string().email().min(1).max(100),
  });
export const validationSuppressionTokenAPI =
  z.object({
    email: z.string().email().min(1).max(100),
  });
