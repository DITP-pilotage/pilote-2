import { z } from "zod";
import { profilsCodes } from "@/shared/utilisateur/Utilisateur.interface";

export const validationProfilContexte = z.object({
  profilCode: z.enum(profilsCodes),
});
