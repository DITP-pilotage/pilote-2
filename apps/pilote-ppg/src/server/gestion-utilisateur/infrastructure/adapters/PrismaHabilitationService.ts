import { HabilitationService } from "@/server/gestion-utilisateur/domain/ports/HabilitationService";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

export class PrismaHabilitationService implements HabilitationService {
  async recupererHabilitations(args: {
    profil: ProfilCode;
    habilitations: Habilitations;
  }): Promise<Habilitation> {
    return new Habilitation({
      habilitations: args.habilitations,
      profil: args.profil,
    });
  }
}
