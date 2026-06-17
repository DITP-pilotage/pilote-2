import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import {
  DonneeChantierContrat,
  presenterEnDonneeChantierContrat,
} from "@/server/chantiers/app/contrats/DonneeChantierContrat";

type Dependances = {
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
};

export class RecupererDonneesChantierQuery {
  private chantierRepository: ChantierRepository;

  private utilisateurRepository: UtilisateurRepository;

  constructor({ chantierRepository, utilisateurRepository }: Dependances) {
    this.chantierRepository = chantierRepository;
    this.utilisateurRepository = utilisateurRepository;
  }

  async handle(
    chantierId: string,
    listeTerritoireCodes: string[],
  ): Promise<DonneeChantierContrat | { message: string }> {
    const listeDonneesChantier =
      await this.chantierRepository.récupérerDonneesChantier(
        chantierId,
        listeTerritoireCodes,
      );

    if (listeDonneesChantier.length === 0) {
      return { message: "Il n'existe aucune donnée pour ce chantier" };
    }

    const allIds = [
      ...new Set([
        ...listeDonneesChantier.flatMap((d) => d.directeursProjetIds),
        ...listeDonneesChantier.flatMap((d) => d.responsablesLocauxIds),
      ]),
    ];
    const utilisateurParId =
      await this.utilisateurRepository.recupererParIds(allIds);

    return presenterEnDonneeChantierContrat(
      listeDonneesChantier,
      utilisateurParId,
    );
  }
}
