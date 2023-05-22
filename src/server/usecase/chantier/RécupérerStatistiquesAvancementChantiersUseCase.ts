import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { MailleNonAutoriséeErreur } from '@/server/utils/errors';

export default class RécupérerStatistiquesAvancementChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantiers: Chantier['id'][], maille: Maille, habilitations: Habilitations): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const maillesAccessibles = habilitation.recupererListeMailleEnLectureDisponible();

    if (!maillesAccessibles.includes(maille)) {
      throw new MailleNonAutoriséeErreur();
    }

    return this.chantierRepository.getChantierStatistiques(habilitations, chantiers, maille);
  }
}
