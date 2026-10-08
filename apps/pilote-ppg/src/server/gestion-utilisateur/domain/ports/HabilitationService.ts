import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export interface HabilitationService {
  recupererHabilitations(args: {
    profil: ProfilCode;
    habilitations: Habilitations;
  }): Promise<Habilitation>;
}
