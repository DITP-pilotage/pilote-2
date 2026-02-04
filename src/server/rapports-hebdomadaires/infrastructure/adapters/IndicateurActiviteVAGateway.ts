import { ActiviteVAGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteVAGateway";
import { EvenementVA } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";
import { PeriodeRapport } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";
import { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { RecupererTerritoiresQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererTerritoiresQuery";

export class IndicateurActiviteVAGateway implements ActiviteVAGateway {
  constructor(
    private readonly deps: {
      evenementsVAQuery: RecupererEvenementsVAParPeriodeQuery;
      territoiresQuery: RecupererTerritoiresQuery;
    },
  ) {}

  async recupererEvenementsDansPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }): Promise<EvenementVA[]> {
    const dtos = await this.deps.evenementsVAQuery.recupererDansPeriode({
      indicateurIds: params.indicateurIds,
      territoireCodes: params.territoireCodes,
      dateDebut: params.periode.dateDebut,
      dateFin: params.periode.dateFin,
    });

    return dtos.map((dto) => ({
      id: dto.id,
      indicateur: {
        id: dto.indicateurId,
        nom: dto.indicateurNom,
      },
      territoire: {
        code: dto.territoireCode,
        nom: dto.territoireNom,
      },
      typeEvenement: dto.typeEvenement,
      dateValeur: dto.dateValeur,
      valeur: dto.valeur,
      dateCreation: dto.dateCreation,
      ordre: dto.ordre,
    }));
  }
}
