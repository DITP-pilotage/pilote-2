import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/framework/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { TerritoireNonAutoriséErreur } from "@/server/utils/errors";

export const chantierRouter = createTRPCRouter({
  recupererTousSynthetisesAccessiblesEnLecture: protectedProcedure.query(
    ({ ctx }) => {
      const recupererChantiersSynthetisesUseCase = getContainer(
        "gestionUtilisateur",
      ).resolve("recupererChantiersSynthetisesUseCase");
      return recupererChantiersSynthetisesUseCase.run({
        listeChantierIdLecture: ctx.session.habilitations.lecture.chantiers,
      });
    },
  ),
  recupererTousLesInformationsChantiers: protectedProcedure.query(() => {
    const recupererLaListeDesInfomrationsChantiersUse = getContainer(
      "gestionUtilisateur",
    ).resolve("recupererLaListeDesInfomrationsChantiersUse");
    return recupererLaListeDesInfomrationsChantiersUse.run();
  }),
  recupererMeteosTerritoires: protectedProcedure
    .input(
      z.object({
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input }) => {
      return getContainer("chantiers")
        .resolve("getChantierMeteosTerritoiresQuery")
        .execute(input);
    }),
  recupererPVAChantierTerritoires: protectedProcedure
    .input(
      z.object({
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(input.chantierId, null);
      return getContainer("chantiers")
        .resolve("getChantierPVACountTerritoiresQuery")
        .execute(input);
    }),
  recupererTauxAvancementTerritoires: protectedProcedure
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Quand aucun chantier n'est spécifié, on utilise tous les chantiers de base
      // (publiés, avec ministère, autorisés) pour être cohérent avec la page d'accueil
      const chantierIds =
        input.chantierIds.length > 0
          ? input.chantierIds.filter((id) =>
              ctx.session.habilitations.lecture.chantiers.includes(id),
            )
          : await getContainer("chantiers")
              .resolve("getChantiersHabilitesQuery")
              .execute(ctx.session.habilitations);

      return getContainer("chantiers")
        .resolve("recupererTauxAvancementsChantierTerritoiresQuery")
        .run({ chantierIds, jalon: input.jalon });
    }),
  recupererRepartitionMeteos: protectedProcedure
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        territoireCode: z.string(),
      }),
    )
    .query(({ input, ctx }) => {
      const chantierIdsAutorises = input.chantierIds.filter((id) =>
        ctx.session.habilitations.lecture.chantiers.includes(id),
      );
      return getContainer("chantiers")
        .resolve("getRepartitionMeteoChantiersQuery")
        .execute({
          chantierIds: chantierIdsAutorises,
          territoireCode: input.territoireCode,
        });
    }),
  recupererChantiersSignales: protectedProcedure
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        territoireCode: z.string(),
        jalonParDefaut: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      const chantierIdsAutorises = input.chantierIds.filter((id) =>
        ctx.session.habilitations.lecture.chantiers.includes(id),
      );
      return getContainer("chantiers")
        .resolve("getChantiersSignalesQuery")
        .execute({
          chantierIds: chantierIdsAutorises,
          territoireCode: input.territoireCode,
          jalonParDefaut: input.jalonParDefaut,
        });
    }),
  recupererAvancementChantier: protectedProcedure
    .input(
      z.object({
        chantierId: z.string(),
        jalon: z.number(),
        territoireCode: z.string(),
      }),
    )
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(
        input.chantierId,
        input.territoireCode,
      );
      return getContainer("chantiers")
        .resolve("getAvancementChantierQuery")
        .execute(input);
    }),
  recupererSituationChantier: protectedProcedure
    .input(
      z.object({
        chantierId: z.string(),
        jalon: z.number(),
        territoireCode: z.string(),
      }),
    )
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(
        input.chantierId,
        input.territoireCode,
      );
      return getContainer("chantiers")
        .resolve("getSituationChantierQuery")
        .execute(input);
    }),
  recupererStatistiquesAvancement: protectedProcedure
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        maille: z.enum(["regionale", "departementale"]),
        jalon: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Quand aucun chantier n'est spécifié, on utilise tous les chantiers de base
      // (publiés, avec ministère, autorisés) pour être cohérent avec la page d'accueil
      const chantierIds =
        input.chantierIds.length > 0
          ? input.chantierIds
          : await getContainer("chantiers")
              .resolve("getChantiersHabilitesQuery")
              .execute(ctx.session.habilitations);

      return getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .run(chantierIds, input.maille, ctx.session.habilitations, input.jalon);
    }),
  recupererTauxAvancementTerritoire: protectedProcedure
    .input(
      z.object({
        territoireCode: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      if (
        !new Habilitation(ctx.session.habilitations).peutAccéderAuTerritoire(
          input.territoireCode,
        )
      ) {
        throw new TerritoireNonAutoriséErreur();
      }
      return getContainer("chantiers")
        .resolve("recupererTauxAvancementTerritoireQuery")
        .execute(input);
    }),
  recupererStatistiquesAvancementTousChantiersPublies: protectedProcedure
    .input(
      z.object({
        territoireCode: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      if (
        !new Habilitation(ctx.session.habilitations).peutAccéderAuTerritoire(
          input.territoireCode,
        )
      ) {
        throw new TerritoireNonAutoriséErreur();
      }
      return getContainer("chantiers")
        .resolve("recupererStatistiquesAvancementTousChantiersPubliesQuery")
        .execute({
          territoireCode: input.territoireCode,
          jalon: input.jalon,
          habilitations: ctx.session.habilitations,
        });
    }),
  recupererChantiersEnRetard: protectedProcedure
    .input(
      z.object({
        territoireCode: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      if (
        !new Habilitation(ctx.session.habilitations).peutAccéderAuTerritoire(
          input.territoireCode,
        )
      ) {
        throw new TerritoireNonAutoriséErreur();
      }
      return getContainer("chantiers").resolve("getChantiersQuery").execute({
        territoireCode: input.territoireCode,
        jalon: input.jalon,
        view: "en_retard",
      });
    }),
  recupererChantiersEnDifficulte: protectedProcedure
    .input(
      z.object({
        territoireCode: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      if (
        !new Habilitation(ctx.session.habilitations).peutAccéderAuTerritoire(
          input.territoireCode,
        )
      ) {
        throw new TerritoireNonAutoriséErreur();
      }
      return getContainer("chantiers").resolve("getChantiersQuery").execute({
        territoireCode: input.territoireCode,
        jalon: input.jalon,
        view: "en_difficulte",
      });
    }),
  recupererIndicateursChantier: protectedProcedure
    .input(
      z.object({
        chantierId: z.string(),
        territoireCode: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(
        input.chantierId,
        input.territoireCode,
      );
      return getContainer("chantiers")
        .resolve("getChantierIndicateursQuery")
        .execute(input);
    }),
});
