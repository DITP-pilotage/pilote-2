import { ChantierRepository } from "@/server/fiche-conducteur/domain/ports/ChantierRepository";
import { DonnéeCartographie } from "@/server/fiche-conducteur/domain/DonnéeCartographie";
import { Meteo } from "@/server/fiche-conducteur/domain/Meteo";
import type { Inject } from "@/server/fiche-conducteur/module";

export class RécupérerDonnéesCartographieUseCase {
  private chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Inject<"chantierRepository">) {
    this.chantierRepository = chantierRepository;
  }

  async run({
    chantierId,
    jalon,
  }: {
    chantierId: string;
    jalon: number;
  }): Promise<DonnéeCartographie[]> {
    const listeChantiersNatEtDept =
      await this.chantierRepository.récupérerMailleNatEtDeptParId(
        chantierId,
        jalon,
      );

    return listeChantiersNatEtDept
      .filter((chantier) => chantier.maille !== "NAT")
      .map((chantier) =>
        DonnéeCartographie.creerDonnéeCartographie({
          territoireCode: chantier.territoireCode,
          tauxAvancement: chantier.tauxAvancement,
          météo: chantier.meteo as Meteo,
          estApplicable: chantier.estApplicable,
        }),
      );
  }
}
