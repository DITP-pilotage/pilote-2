import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import {
  DonneeChantierContrat,
  presenterEnDonneeChantierContrat,
} from '@/server/chantiers/app/contrats/DonneeChantierContrat';

type Dependances = {
  chantierRepository: ChantierRepository;
};

export class RecupererDonneesChantierQuery {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependances) {
    this.chantierRepository = chantierRepository;
  }

  async handle(chantierId: string, listeTerritoireCodes: string[]): Promise<DonneeChantierContrat | { message: string }> {
    const listeDonneesChantier = await this.chantierRepository.récupérerDonneesChantier(chantierId, listeTerritoireCodes);

    return listeDonneesChantier.length > 0 ? presenterEnDonneeChantierContrat(listeDonneesChantier) : {
      message: "Il n'existe aucune donnée pour ce chantier",
    };
  }
}
