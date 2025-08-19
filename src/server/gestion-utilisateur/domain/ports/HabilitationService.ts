import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

export interface HabilitationService {
  recupererHabilitations(args: {
    habilitations: Habilitations;
  }): Promise<Habilitation>;
}
