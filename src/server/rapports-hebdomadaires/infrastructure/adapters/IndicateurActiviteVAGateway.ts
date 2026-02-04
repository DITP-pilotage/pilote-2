import { ActiviteIndicateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteVAGateway";
import { EvenementIndicateur } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";
import { PeriodeRapport } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";
import { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";

export class IndicateurActiviteGateway implements ActiviteIndicateurGateway {
  constructor(
    private readonly deps: {
      evenementsVAQuery: RecupererEvenementsVAParPeriodeQuery;
      mesuresIndicateurQuery: RecupererMesuresIndicateurParPeriodeQuery;
    },
  ) {}

  async recupererEvenementsDansPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }): Promise<EvenementIndicateur[]> {
    const [dtosVA, dtosVIVC] = await Promise.all([
      this.deps.evenementsVAQuery.recupererDansPeriode({
        indicateurIds: params.indicateurIds,
        territoireCodes: params.territoireCodes,
        dateDebut: params.periode.dateDebut,
        dateFin: params.periode.dateFin,
      }),
      this.deps.mesuresIndicateurQuery.execute({
        indicateurIds: params.indicateurIds,
        territoireCodes: params.territoireCodes,
        dateDebut: params.periode.dateDebut,
        dateFin: params.periode.dateFin,
        typesValeur: ["VALEUR_INITIALE", "VALEUR_CIBLE"],
      }),
    ]);

    const evenementsVA: EvenementIndicateur[] = dtosVA.map((dto) => ({
      id: dto.id,
      indicateur: {
        id: dto.indicateurId,
        nom: dto.indicateurNom,
      },
      territoire: {
        code: dto.territoireCode,
        nom: dto.territoireNom,
      },
      typeValeur: "VALEUR_AVANCEMENT" as const,
      dateValeur: dto.dateValeur,
      valeur: dto.valeur,
      dateCreation: dto.dateCreation,
      ordre: dto.ordre,
    }));

    const evenementsVIVC: EvenementIndicateur[] = dtosVIVC.map((dto) => ({
      id: dto.id,
      indicateur: {
        id: dto.indicateurId,
        nom: dto.indicateurNom,
      },
      territoire: {
        code: dto.territoireCode,
        nom: dto.territoireNom,
      },
      typeValeur: dto.typeValeur,
      dateValeur: dto.dateValeur,
      valeur: dto.valeur,
      dateCreation: dto.dateImport,
      ordre: 0,
    }));

    const allEvenements = [...evenementsVA, ...evenementsVIVC];

    return allEvenements.sort((a, b) => {
      const territoireCompare = a.territoire.code.localeCompare(
        b.territoire.code,
      );
      if (territoireCompare !== 0) return territoireCompare;
      return a.dateValeur.getTime() - b.dateValeur.getTime();
    });
  }
}
