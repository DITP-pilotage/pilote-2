import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { MinistereRepository } from '@/server/chantiers/domain/ports/MinistereRepository';
import { parseChantierNew } from '@/server/chantiers/infrastructure/adapters/PrismaChantierParser';
import { TerritoireRepository } from '@/server/chantiers/domain/ports/TerritoireRepository';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

type Dependencies = {
  chantierRepository: ChantierRepository;
  ministèreRepository: MinistereRepository;
  territoireRepository: TerritoireRepository;
};

// Tests supprimés car on ne peut pas tester les récupérations de données
export class RécupérerChantierUseCase {
  private readonly chantierRepository: ChantierRepository;

  private readonly ministèreRepository: MinistereRepository;

  private readonly territoireRepository: TerritoireRepository;

  constructor({
    chantierRepository,
    ministèreRepository,
    territoireRepository,
  } : Dependencies) {
    this.chantierRepository = chantierRepository;
    this.ministèreRepository = ministèreRepository;
    this.territoireRepository = territoireRepository;
  }

  async run(chantierId: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<Chantier> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    const ministères = await this.ministèreRepository.getListe();
    const territoires = await this.territoireRepository.récupérerTousNew();
    const chantierRows = await this.chantierRepository.récupérerLesEntréesDUnChantier(chantierId, habilitations, profil, jalon);
    return parseChantierNew(chantierRows, territoires, ministères);
  }
}
