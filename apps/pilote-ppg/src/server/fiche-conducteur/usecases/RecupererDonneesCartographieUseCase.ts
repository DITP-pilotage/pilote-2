import { ChantierRepository } from "@/server/fiche-conducteur/domain/ports/ChantierRepository";
import { DonneeCartographie } from "@/server/fiche-conducteur/domain/DonneeCartographie";
import { Meteo } from "@/server/fiche-conducteur/domain/Meteo";
import type { Inject } from "@/server/fiche-conducteur/module";

export class RecupererDonneesCartographieUseCase {
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
  }): Promise<DonneeCartographie[]> {
    const listeChantiersNatEtDept =
      await this.chantierRepository.récupérerMailleNatEtDeptParId(
        chantierId,
        jalon,
      );

    return listeChantiersNatEtDept
      .filter((chantier) => chantier.maille !== "NAT")
      .map((chantier) =>
        DonneeCartographie.creerDonnéeCartographie({
          territoireCode: chantier.territoireCode,
          tauxAvancement: chantier.tauxAvancement,
          météo: chantier.meteo as Meteo,
          estApplicable: chantier.estApplicable,
        }),
      );
  }
}
