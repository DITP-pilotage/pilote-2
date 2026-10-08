import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { validationHistoriqueIndicateurTerritoire } from "@/validation/indicateur";
import { getContainer } from "@/server/dependances";

export const indicateurRouter = createTRPCRouter({
  recupererHistoriqueIndicateurTerritoire: protectedProcedure
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
  recupererValeursAvancementTerritoires: protectedProcedure
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
  recupererEvolutionValeursAvancementTerritoires: protectedProcedure
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getContainer("chantiers")
        .resolve("recupererEvolutionValeursAvancementTerritoiresQuery")
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
    }),
  recupererEvolutionTauxAvancementTerritoires: protectedProcedure
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getContainer("chantiers")
        .resolve("recupererEvolutionTauxAvancementTerritoiresQuery")
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
    }),
  recupererStatistiquesValeurAvancement: protectedProcedure
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
  recupererTauxAvancementTerritoires: protectedProcedure
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
  recupererPVATerritoires: protectedProcedure
    .input(
      z.object({
        indicateurId: z.string(),
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return getContainer("chantiers")
        .resolve("getIndicateurPVACountTerritoiresQuery")
        .execute({
          indicateurId: input.indicateurId,
          chantierId: input.chantierId,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
          profil: ctx.session.profil,
        });
    }),
  recupererStatistiquesTauxAvancement: protectedProcedure
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
        .resolve("getStatistiquesTauxAvancementIndicateurTerritoiresQuery")
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
