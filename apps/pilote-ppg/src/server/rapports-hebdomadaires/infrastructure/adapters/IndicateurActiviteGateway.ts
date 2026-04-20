import { type ActiviteIndicateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteVAGateway";
import { type EvenementIndicateur } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";
import { type PeriodeRapport } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";
import type { Inject } from "@/server/rapports-hebdomadaires/module";

export class IndicateurActiviteGateway implements ActiviteIndicateurGateway {
  constructor(
    private readonly deps: Inject<
      "evenementsVAQuery" | "mesuresIndicateurQuery"
    >,
  ) {}

  async recupererEvenementsDansPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }): Promise<EvenementIndicateur[]> {
    const [evenementsVA, evenementsVIVC] = await Promise.all([
      this.getEvenementsVA(params),
      this.getEvenementsVIVC(params),
    ]);

    const allEvenements = [...evenementsVA, ...evenementsVIVC];

    return allEvenements.sort((a, b) => {
      const territoireCompare = a.territoire.code.localeCompare(
        b.territoire.code,
      );
      if (territoireCompare !== 0) return territoireCompare;
      return a.dateValeur.getTime() - b.dateValeur.getTime();
    });
  }

  private async getEvenementsVIVC(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }) {
    const evenements = await this.deps.mesuresIndicateurQuery.execute({
      indicateurIds: params.indicateurIds,
      territoireCodes: params.territoireCodes,
      dateDebut: params.periode.dateDebut,
      dateFin: params.periode.dateFin,
      typesValeur: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
    });

    return evenements.map((evenement) => ({
      id: evenement.id,
      indicateur: {
        id: evenement.indicateurId,
        nom: evenement.indicateurNom,
      },
      territoire: {
        code: evenement.territoireCode,
        nom: evenement.territoireNom,
      },
      typeValeur: evenement.typeValeur,
      dateValeur: evenement.dateValeur,
      valeur: evenement.valeur,
      dateCreation: evenement.dateImport,
      ordre: 0,
    }));
  }

  private async getEvenementsVA(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }) {
    const evenements = await this.deps.evenementsVAQuery.recupererDansPeriode({
      indicateurIds: params.indicateurIds,
      territoireCodes: params.territoireCodes,
      dateDebut: params.periode.dateDebut,
      dateFin: params.periode.dateFin,
    });

    return evenements.map((evenement) => ({
      id: evenement.id,
      indicateur: {
        id: evenement.indicateurId,
        nom: evenement.indicateurNom,
      },
      territoire: {
        code: evenement.territoireCode,
        nom: evenement.territoireNom,
      },
      typeValeur: "VALEUR_AVANCEMENT" as const,
      dateValeur: evenement.dateValeur,
      valeur: evenement.valeur,
      dateCreation: evenement.dateCreation,
      ordre: evenement.ordre,
    }));
  }
}
