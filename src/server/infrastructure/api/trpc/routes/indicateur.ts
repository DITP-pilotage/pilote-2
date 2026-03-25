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
      return getContainer("chantiers")
        .resolve("recupererValeursAvancementIndicateurTerritoiresQuery")
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
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
      return getContainer("chantiers")
        .resolve(
          "getValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery",
        )
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          maille: input.maille,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
    }),
  recupererTauxAvancementTerritoires: procédureProtégée
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getContainer("chantiers")
        .resolve("recupererTauxAvancementIndicateurTerritoiresQuery")
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
    }),
  recupererStatistiquesTauxAvancement: procédureProtégée
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        maille: z.enum(["regionale", "departementale"]),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getContainer("chantiers")
        .resolve(
          "getStatistiquesTauxAvancementIndicateurTerritoiresQuery",
        )
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          maille: input.maille,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
    }),
});
