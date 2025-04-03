import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { MailleNonAutoriséeErreur } from '@/server/utils/errors';
import { Maille } from '@/server/chantiers/domain/Territoire';
type Dependencies = {
  chantierRepository: ChantierRepository;
};

export class RécupérerStatistiquesAvancementChantiersUseCase {
  private readonly chantierRepository: ChantierRepository;

  constructor({
    chantierRepository,
  }: Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run(chantiers: Chantier['id'][], maille: Maille, habilitations: Habilitations): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const maillesAccessibles = habilitation.recupererListeMailleEnLectureDisponible();

    if (!maillesAccessibles.includes(maille)) {
      throw new MailleNonAutoriséeErreur();
    }

    return this.chantierRepository.getChantierStatistiques(habilitations, chantiers, maille);
  }
}
