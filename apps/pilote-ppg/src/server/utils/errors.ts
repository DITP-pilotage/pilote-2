import { z } from "zod";

export const isENOENTError = (err: unknown) =>
  z.object({ code: z.literal("ENOENT") }).safeParse(err).success;

export const isUtilisateurDoublonError = (error: unknown) =>
  z
    .object({
      message: z.literal("Request failed with status code 409"),
      responseData: z.object({
        errorMessage: z.literal("User exists with same username"),
      }),
    })
    .safeParse(error).success;
