import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { toISODate } from "@/server/app/domain/Dates";
import { PiloteError } from "@/server/app/error-boundary/pilote-error";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

export type CreerIndicateurTerritoireValeurEvenementInput = {
  indicId: string;
  territoireCode: string;
  valeurAvancement: number;
  dateValeurAvancement: Date;
  idAuteurModification: string;
  motif: string;
  sourceDonneeEtMethodeCalcul: string;
};

interface Dependencies {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  indicateurRepository: IndicateurRepository;
}

export class CreerPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private readonly indicateurRepository: IndicateurRepository;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    indicateurRepository,
  }: Dependencies) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.indicateurRepository = indicateurRepository;
  }

  async run(
    input: CreerIndicateurTerritoireValeurEvenementInput,
  ): Promise<void> {
    await this.peutCreerPropositionSurDateCible(input);

    const evenementsSurDate =
      await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          dateValeur: input.dateValeurAvancement,
          typeValeur: "VALEUR_AVANCEMENT",
        },
      );

    const evenement = evenementsSurDate.creerEvenementPropositionValeurCreee({
      valeur: input.valeurAvancement,
      auteurId: input.idAuteurModification,
      donneesComplementaires: {
        motif: input.motif,
        sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
      },
    });

    await this.indicateurTerritoireValeurEvenementRepository.enregistrer(
      evenement,
    );
  }

  private async peutCreerPropositionSurDateCible(
    input: CreerIndicateurTerritoireValeurEvenementInput,
  ) {
    const dateEffective =
      await this.indicateurRepository.getDateEffectiveValeurAvancement(input);

    this.verifierDatePropositionAvantAujourdhui(input.dateValeurAvancement);
    this.verifierDatePropositionApresDateEffective(
      dateEffective,
      input.dateValeurAvancement,
    );
    await this.verifierPasAutrePropositionEnCours(dateEffective, input);
  }

  verifierDatePropositionAvantAujourdhui(dateProposition: Date) {
    const aujourdhui = new Date();
    if (toISODate(dateProposition) > toISODate(aujourdhui)) {
      throw new BadRequestError(
        "La date de la proposition ne peut pas être postérieure à aujourd'hui",
      );
    }
  }

  private async verifierPasAutrePropositionEnCours(
    dateEffective: Date | null,
    input: { indicId: string; territoireCode: string },
  ) {
    if (dateEffective) {
      const evenementsApresDateEffective =
        await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA(
          {
            indicId: input.indicId,
            territoireCode: input.territoireCode,
            dateValeur: dateEffective,
            typeValeur: "VALEUR_AVANCEMENT",
          },
        );

      const aPropositionsApresDateEffective = evenementsApresDateEffective.some(
        (evenements) => evenements.evenementPropositionValeurEnCours() != null,
      );

      if (aPropositionsApresDateEffective) {
        throw new BadRequestError(
          "Il existe déjà une proposition de valeur d'avancement postérieure à la date effective de la valeur d'avancement",
        );
      }
    }
  }

  private verifierDatePropositionApresDateEffective(
    dateEffective: Date | null,
    dateProposition: Date,
  ) {
    if (
      dateEffective &&
      toISODate(dateEffective) > toISODate(dateProposition)
    ) {
      throw new BadRequestError(
        "La date de la proposition ne peut être antérieure à la date effective de la valeur d'avancement",
      );
    }
  }
}
