import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";
import { soumettreAutoEvaluationCommandSchema } from "@/server/evaluation/handlers/SoumettreAutoEvaluationHandler";
import { enregisterEvaluationCommandSchema } from "@/server/evaluation/services/EnregistrerEvaluationService";
import { debloquerFichesConsolidationCommandSchema } from "@/server/evaluation/handlers/DebloquerFichesConsolidationHandler";
import { modifierEtatFichesInstructionCommandSchema } from "@/server/evaluation/handlers/ModifierEtatFichesInstructionHandler";
import { passerALEtapeInstructionCommandSchema } from "@/server/evaluation/handlers/PasserALEtapeInstructionHandler";
import { enregisterEvaluationCriteresCommandSchema } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler";
import { enregisterEvaluationObjectifsCommandSchema } from "@/server/evaluation/handlers/EnregistrerBrouillonAutoEvaluationObjectifsHandler";
import { validerSaisieCriteresCommandSchema } from "@/server/evaluation/handlers/ValiderSaisieCriteresHandler";
import { validerSaisieObjectifsCommandSchema } from "@/server/evaluation/handlers/ValiderSaisieObjectifsHandler";

export const evaluationRouter = créerRouteurTRPC({
  getDroitsPiloteEval: procédureProtégée.query(async ({ ctx }) => {
    const accesFicheEvaluationService = getContainer("piloteEval").resolve(
      "accesFicheEvaluationService",
    );

    const [
      peutAccederConsolidation,
      peutAccederInstruction,
      peutAccederPilotage,
    ] = await Promise.all([
      accesFicheEvaluationService.peutAccederEtapeConsolidation({
        utilisateurId: ctx.session.user.id,
      }),
      accesFicheEvaluationService.peutAccederEtapeInstruction({
        utilisateurId: ctx.session.user.id,
      }),
      accesFicheEvaluationService.peutAccederEtapePilotage({
        applicationsAccessibles: ctx.session.applicationsAccessibles,
      }),
    ]);

    return {
      peutAccederConsolidation,
      peutAccederInstruction,
      peutAccederPilotage,
    };
  }),

  enregistrerBrouillonAutoEvaluationObjectifs: procédureProtégée
    .input(enregisterEvaluationObjectifsCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("enregistrerBrouillonAutoEvaluationObjectifs")
        .execute(input, ctx.session.user.id);
    }),

  enregistrerBrouillonAutoEvaluationCriteres: procédureProtégée
    .input(enregisterEvaluationCriteresCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("enregistrerBrouillonAutoEvaluationCriteres")
        .execute(input, ctx.session.user.id);
    }),

  validerSaisieObjectifs: procédureProtégée
    .input(validerSaisieObjectifsCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("validerSaisieObjectifs")
        .execute(input);
    }),

  validerSaisieCriteres: procédureProtégée
    .input(validerSaisieCriteresCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("validerSaisieCriteres")
        .execute(input);
    }),

  enregistrerBrouillonConsolidation: procédureProtégée
    .input(enregisterEvaluationCommandSchema.array())
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeConsolidation({
          utilisateurId: ctx.session.user.id,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("enregistrerBrouillonConsolidationHandler")
        .execute(input, ctx.session.user.id);
    }),

  enregistrerBrouillonInstruction: procédureProtégée
    .input(enregisterEvaluationCommandSchema.array())
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheInstruction = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeInstruction({
          utilisateurId: ctx.session.user.id,
        });

      if (!peutAccederFicheInstruction)
        throw new ForbiddenError("Accès refusé à la fiche d'instruction");

      await getContainer("piloteEval")
        .resolve("enregistrerBrouillonInstructionHandler")
        .execute(input, ctx.session.user.id);
    }),

  soumettreAutoEvaluation: procédureProtégée
    .input(soumettreAutoEvaluationCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapeAutoEvaluation({
          utilisateurId: ctx.session.user.id,
          ficheEvaluationId: input.ficheEvaluationId,
        });

      if (!peutAccederFicheAutoEvaluation)
        throw new ForbiddenError("Accès refusé à la fiche d'auto-évaluation");

      await getContainer("piloteEval")
        .resolve("soumettreAutoEvaluationHandler")
        .execute(input, ctx.session.user.id);
    }),

  debloquerFichesConsolidation: procédureProtégée
    .input(debloquerFichesConsolidationCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederPilotage = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapePilotage({
          applicationsAccessibles: ctx.session.applicationsAccessibles,
        });

      if (!peutAccederPilotage)
        throw new ForbiddenError("Accès refusé au pilotage");

      await getContainer("piloteEval")
        .resolve("debloquerFichesConsolidationHandler")
        .execute(input);
    }),

  modifierEtatFichesInstruction: procédureProtégée
    .input(modifierEtatFichesInstructionCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederPilotage = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapePilotage({
          applicationsAccessibles: ctx.session.applicationsAccessibles,
        });

      if (!peutAccederPilotage)
        throw new ForbiddenError("Accès refusé au pilotage");

      await getContainer("piloteEval")
        .resolve("modifierEtatFichesInstructionHandler")
        .execute(input);
    }),

  passerALEtapeInstruction: procédureProtégée
    .input(passerALEtapeInstructionCommandSchema)
    .mutation(async ({ input, ctx }) => {
      const peutAccederPilotage = await getContainer("piloteEval")
        .resolve("accesFicheEvaluationService")
        .peutAccederEtapePilotage({
          applicationsAccessibles: ctx.session.applicationsAccessibles,
        });

      if (!peutAccederPilotage)
        throw new ForbiddenError("Accès refusé au pilotage");

      await getContainer("piloteEval")
        .resolve("passerALEtapeInstructionHandler")
        .execute(input, ctx.session.user.id);
    }),
});
