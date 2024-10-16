import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDateDeMàjMeteoRepository.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default class RécupérerChantierUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository,
    private readonly chantierDatesDeMàjRepository: ChantierDatesDeMàjRepository,
    private readonly ministèreRepository: MinistèreRepository,
    private readonly territoireRepository: TerritoireRepository,
  ) {}

  async run(chantierId: string, habilitations: Habilitations, profil: ProfilCode): Promise<Chantier> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);
    const territoireCodes = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
    
    const ministères = await this.ministèreRepository.getListe();
    const territoires = await this.territoireRepository.récupérerTous();
    const chantierRows = await this.chantierRepository.récupérerLesEntréesDUnChantier(chantierId, habilitations, profil);
    const chantiersRowsDatesDeMàj = await this.chantierDatesDeMàjRepository.récupérerDateDeMiseÀJourMeteo([chantierId], territoireCodes);
    return parseChantier(chantierRows, territoires, ministères, chantiersRowsDatesDeMàj);
  }
}
