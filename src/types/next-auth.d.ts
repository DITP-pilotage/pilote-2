import { DefaultSession } from "next-auth";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/utilisateur/utilisateur.interface";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      address: string;
    } & DefaultSession["user"];
    accessToken: string;
    error: any;
    habilitations: Habilitations;
    profil: ProfilCode;
    profilAAccèsAuxChantiersBrouillons: boolean;
  }
}
