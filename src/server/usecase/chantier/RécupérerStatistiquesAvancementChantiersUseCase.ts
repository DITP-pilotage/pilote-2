import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { getSession } from 'next-auth/react';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default class RécupérerStatistiquesAvancementChantiersUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
  ) {}

  async run(chantiers: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques> {
  console.log('TADTAs')
  // FIXME recuperer les bonnes habilitations !!!
  const habilitations : Habilitations = {
    lecture: {
      chantiers: chantiers,
      territoires: []
    },
    'saisie.commentaire': {chantiers: [], territoires: []},
    'saisie.indicateur': {chantiers: [], territoires: []},
  }
    return this.chantierRepository.getChantierStatistiques(habilitations, chantiers, maille);
  }
}
