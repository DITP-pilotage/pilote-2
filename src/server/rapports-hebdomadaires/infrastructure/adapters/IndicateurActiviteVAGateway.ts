import {
  ActiviteVAGateway,
  TerritoireInfo,
} from "@/server/rapports-hebdomadaires/domain/ports/ActiviteVAGateway";
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
      indicateurId: dto.indicateurId,
      indicateurNom: dto.indicateurNom,
      territoireCode: dto.territoireCode,
      territoireNom: dto.territoireNom,
      typeEvenement: dto.typeEvenement,
      dateValeur: dto.dateValeur,
      valeur: dto.valeur,
      dateCreation: dto.dateCreation,
      ordre: dto.ordre,
    }));
  }

  async recupererDernierEvenementAvantPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
  }): Promise<EvenementVA[]> {
    const dtos = await this.deps.evenementsVAQuery.recupererDernierAvantDate({
      indicateurIds: params.indicateurIds,
      territoireCodes: params.territoireCodes,
      dateAvant: params.dateDebut,
    });

    return dtos.map((dto) => ({
      id: dto.id,
      indicateurId: dto.indicateurId,
      indicateurNom: dto.indicateurNom,
      territoireCode: dto.territoireCode,
      territoireNom: dto.territoireNom,
      typeEvenement: dto.typeEvenement,
      dateValeur: dto.dateValeur,
      valeur: dto.valeur,
      dateCreation: dto.dateCreation,
      ordre: dto.ordre,
    }));
  }

  async recupererTerritoires(
    territoireCodes: string[],
  ): Promise<Record<string, TerritoireInfo>> {
    return this.deps.territoiresQuery.execute(territoireCodes);
  }
}
