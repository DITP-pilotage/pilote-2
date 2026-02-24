import { ChantierRepository } from "@/server/fiche-conducteur/domain/ports/ChantierRepository";
import { AvancementFicheConducteur } from "@/server/fiche-conducteur/domain/AvancementFicheConducteur";

interface Dependencies {
  chantierRepository: ChantierRepository;
}

export class RécupérerAvancementUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  async run({
    chantierId,
    jalon,
  }: {
    chantierId: string;
    jalon: number;
  }): Promise<AvancementFicheConducteur> {
    const listeChantiers =
      await this.chantierRepository.récupérerMailleNatEtDeptParId(
        chantierId,
        jalon,
      );

    const chantierNational = listeChantiers.find(
      (chantier) => chantier.maille === "NAT",
    )!;
    const listeAscChantiersDepartementTauxAvancement = listeChantiers
      .filter((chantier) => chantier.maille === "DEPT")
      .map((chantier) => chantier.tauxAvancementAnnuel)
      .filter((avancement) => avancement != null)
      .sort((a, b) => a - b);

    let mediane: number;
    const indexMilieu = Math.floor(
      listeAscChantiersDepartementTauxAvancement.length / 2,
    );

    mediane =
      listeAscChantiersDepartementTauxAvancement.length % 2 === 0
        ? (listeAscChantiersDepartementTauxAvancement[indexMilieu - 1] +
            listeAscChantiersDepartementTauxAvancement[indexMilieu]) /
          2
        : listeAscChantiersDepartementTauxAvancement[indexMilieu];

    return AvancementFicheConducteur.creerAvancementFicheConducteur({
      annuel: chantierNational.tauxAvancementAnnuel,
      minimum:
        listeAscChantiersDepartementTauxAvancement.length === 0
          ? null
          : listeAscChantiersDepartementTauxAvancement[0],
      mediane:
        listeAscChantiersDepartementTauxAvancement.length === 0
          ? null
          : mediane,
      maximum:
        listeAscChantiersDepartementTauxAvancement.length === 0
          ? null
          : listeAscChantiersDepartementTauxAvancement[
              listeAscChantiersDepartementTauxAvancement.length - 1
            ],
    });
  }
}
