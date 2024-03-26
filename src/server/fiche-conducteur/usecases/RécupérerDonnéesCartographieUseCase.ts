import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import { DonnéeCartographie } from '@/server/fiche-conducteur/domain/DonnéeCartographie';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

interface Dependencies {
  chantierRepository: ChantierRepository
}

export class RécupérerDonnéesCartographieUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run({ chantierId }: { chantierId: string }): Promise<DonnéeCartographie[]> {
    const listeChantiersNatEtDept = await this.chantierRepository.récupérerMailleNatEtDeptParId(chantierId);

    return listeChantiersNatEtDept.filter(chantier => chantier.maille !== 'NAT').map(chantier => (
      DonnéeCartographie.creerDonnéeCartographie({
        codeInsee: chantier.codeInsee,
        tauxAvancement: chantier.tauxAvancement,
        météo: chantier.meteo as Meteo,
        estApplicable: chantier.estApplicable,
      })
    ));
  }
}
