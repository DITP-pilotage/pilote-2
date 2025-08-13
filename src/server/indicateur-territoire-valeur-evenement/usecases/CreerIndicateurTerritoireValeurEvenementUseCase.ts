import { randomUUID } from "node:crypto";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

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
}

export class CreerIndicateurTerritoireValeurEvenementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({ indicateurTerritoireValeurEvenementRepository }: Dependencies) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
  }

  async run(
    input: CreerIndicateurTerritoireValeurEvenementInput,
  ): Promise<void> {
    const evenementsExistants =
      await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: input.dateValeurAvancement,
        },
      );

    const prochainOrdre =
      IndicateurTerritoireValeurEvenement.prochainOrdre(evenementsExistants);

    const indicateurTerritoireValeurEvenement =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: input.dateValeurAvancement,
          valeur: input.valeurAvancement,
          idAuteurModification: input.idAuteurModification,
          correlationId: randomUUID(),
          ordre: prochainOrdre,
          donneesComplementaires: {
            motif: input.motif,
            sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
          },
        },
      );

    await this.indicateurTerritoireValeurEvenementRepository.enregistrer(
      indicateurTerritoireValeurEvenement,
    );
  }
}
