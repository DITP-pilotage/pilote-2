import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { validationHistoriqueIndicateurTerritoire } from "@/validation/indicateur";
import { getContainer } from "@/server/dependances";

export const indicateurRouter = créerRouteurTRPC({
  recupererHistoriqueIndicateurTerritoire: procédureProtégée
    .input(validationHistoriqueIndicateurTerritoire)
    .query(async ({ input }) => {
      return getContainer("indicateurTerritoireValeurEvenement")
        .resolve(
          "recupererHistoriqueIndicateurTerritoireValeurEvenementUseCase",
        )
        .run({
          indicId: input.indicateurId,
          territoireCode: input.territoireCode,
        });
    }),
  recupererValeursAvancementTerritoires: procédureProtégée
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const result = await getContainer("chantiers")
        .resolve("listerDetailsIndicateurTerritoireUseCaseV2")
        .run(
          [input.indicateurId],
          input.chantierId,
          ctx.session.habilitations,
          ctx.session.profil,
          input.jalon,
        );

      const details = result[input.indicateurId] ?? {};

      return Object.entries(details).map(([territoireCode, detail]) => ({
        territoireCode,
        valeurAvancement: detail.valeurAvancement,
        valeurCibleAnnuelle: detail.valeurCibleAnnuelle,
        estApplicable: detail.estApplicable,
      }));
    }),
  recupererStatistiquesValeurAvancement: procédureProtégée
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        maille: z.enum(["regionale", "departementale"]),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const result = await getContainer("chantiers")
        .resolve("listerDetailsIndicateurTerritoireUseCaseV2")
        .run(
          [input.indicateurId],
          input.chantierId,
          ctx.session.habilitations,
          ctx.session.profil,
          input.jalon,
        );

      const details = result[input.indicateurId] ?? {};
      const prefixeMaille =
        input.maille === "regionale" ? "REG-" : "DEPT-";

      const valeurs = Object.entries(details)
        .filter(
          ([territoireCode, detail]) =>
            territoireCode.startsWith(prefixeMaille) &&
            detail.estApplicable !== false,
        )
        .map(([, detail]) => detail.valeurAvancement)
        .filter((valeur): valeur is number => valeur !== null);

      valeurs.sort((valueA, valueB) => valueA - valueB);

      const minimum = valeurs.length > 0 ? valeurs[0] : null;
      const maximum = valeurs.length > 0 ? valeurs[valeurs.length - 1] : null;
      let médiane: number | null = null;
      if (valeurs.length > 0) {
        const mid = Math.floor(valeurs.length / 2);
        médiane =
          valeurs.length % 2 === 0
            ? (valeurs[mid - 1] + valeurs[mid]) / 2
            : valeurs[mid];
      }

      return { minimum, médiane, maximum };
    }),
});
