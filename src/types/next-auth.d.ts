import { DefaultSession } from "next-auth";
import { $Enums } from "@prisma/client";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/utilisateur/utilisateur.interface";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    accessToken: string;
    habilitations: Habilitations;
    applicationsAccessibles: $Enums.application_accessible[];
    profil: ProfilCode;
    profilAAccèsAuxChantiersBrouillons: boolean;
  }
}
