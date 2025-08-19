import { HabilitationService } from "@/server/gestion-utilisateur/domain/ports/HabilitationService";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

export class PrismaHabilitationService implements HabilitationService {
  async recupererHabilitations(args: {
    habilitations: Habilitations;
  }): Promise<Habilitation> {
    return new Habilitation({ habilitations: args.habilitations });
  }
}
