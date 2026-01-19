import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

export interface HabilitationService {
  recupererHabilitations(args: {
    profil: ProfilCode;
    habilitations: Habilitations;
  }): Promise<Habilitation>;
}
