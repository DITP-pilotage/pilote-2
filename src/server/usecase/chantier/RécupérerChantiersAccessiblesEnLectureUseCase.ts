import { chantier as chantierPrisma } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import { groupBy } from '@/client/utils/arrays';
import { objectEntries } from '@/client/utils/objects/objects';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Profil } from '@/server/domain/utilisateur/Utilisateur.interface';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';

export default class RécupérerChantiersAccessiblesEnLectureUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly chantierDatesDeMàjRepository: ChantierDatesDeMàjRepository = dependencies.getChantierDatesDeMàjRepository(),
    private readonly ministèreRepository: MinistèreRepository = dependencies.getMinistèreRepository(),
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}

  async run(habilitations: Habilitations, profil: Profil): Promise<Chantier[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const ministères = await this.ministèreRepository.getListe();
    const territoires = await this.territoireRepository.récupérerTous();
    const chantiersRows = await this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilités(habilitation, profil);
    const chantiersRowsDatesDeMàj = await this.chantierDatesDeMàjRepository.récupérerDatesDeMiseÀJour(chantiersLecture, territoiresLecture);
    const chantiersGroupésParId = groupBy<chantierPrisma>(chantiersRows, chantier => chantier.id);
    let chantiers = objectEntries(chantiersGroupésParId).map(([_, chantier]) => parseChantier(chantier, territoires, ministères, chantiersRowsDatesDeMàj));

    if (profil === 'DROM') {
      chantiers = chantiers.map(chantier => {
        if (!chantier.périmètreIds.includes('PER-018')) {
          chantier.mailles.nationale.FR.avancement.global = null;
          chantier.mailles.nationale.FR.avancement.annuel = null;
          chantier.mailles.nationale.FR.météo = 'NON_RENSEIGNEE';
        }
  
        return chantier;
      });
    }

    return chantiers;
  }
}
