import { DefaultSession } from "next-auth";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ApplicationAccessible } from "@/server/domain/utilisateur/Utilisateur.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/utilisateur/utilisateur.interface";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    accessToken: string;
    habilitations: Habilitations;
    applicationsAccessibles: ApplicationAccessible[];
    profil: ProfilCode;
    profilAAccèsAuxChantiersBrouillons: boolean;
  }
}
