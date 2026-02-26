import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import {
  DonneeChantierContrat,
  presenterEnDonneeChantierContrat,
} from "@/server/chantiers/app/contrats/DonneeChantierContrat";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

type Dependances = {
  chantierRepository: ChantierRepository;
};

export class RecupererDonneesChantierQuery {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependances) {
    this.chantierRepository = chantierRepository;
  }

  async handle(
    chantierId: string,
    listeTerritoireCodes: string[],
    jalonChoisi?: number,
  ): Promise<DonneeChantierContrat | { message: string }> {
    const jalon =
      jalonChoisi ??
      getAnneeDateDeBascule(
        new Date(),
        configuration().dateBasculeAffichageValeursAnneePrecedente,
      );

    const listeDonneesChantier =
      await this.chantierRepository.récupérerDonneesChantier(
        chantierId,
        listeTerritoireCodes,
        jalon,
      );

    return listeDonneesChantier.length > 0
      ? presenterEnDonneeChantierContrat(listeDonneesChantier)
      : {
          message: "Il n'existe aucune donnée pour ce chantier",
        };
  }
}
