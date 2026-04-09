import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { TerritoireNonAutoriséErreur } from "@/server/utils/errors";

export const chantierRouter = créerRouteurTRPC({
  récupérerTousSynthétisésAccessiblesEnLecture: procédureProtégée.query(
    ({ ctx }) => {
      const récupérerChantiersSynthétisésUseCase = getContainer(
        "gestionUtilisateur",
      ).resolve("recupererChantiersSynthetisesUseCase");
      return récupérerChantiersSynthétisésUseCase.run({
        listeChantierIdLecture: ctx.session.habilitations.lecture.chantiers,
      });
    },
  ),
  recupererTousLesInformationsChantiers: procédureProtégée.query(() => {
    const recupererLaListeDesInfomrationsChantiersUse = getContainer(
      "gestionUtilisateur",
    ).resolve("recupererLaListeDesInfomrationsChantiersUse");
    return recupererLaListeDesInfomrationsChantiersUse.run();
  }),
  recupererMeteosTerritoires: procédureProtégée
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
  recupererPVAChantierTerritoires: procédureProtégée
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
  recupererTauxAvancementTerritoires: procédureProtégée
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      const chantierIdsAutorisés = input.chantierIds.filter((id) =>
        ctx.session.habilitations.lecture.chantiers.includes(id),
      );
      return getContainer("chantiers")
        .resolve("recupererTauxAvancementsChantierTerritoiresQuery")
        .run({ chantierIds: chantierIdsAutorisés, jalon: input.jalon });
    }),
  recupererRepartitionMeteos: procédureProtégée
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        territoireCode: z.string(),
      }),
    )
    .query(({ input, ctx }) => {
      const chantierIdsAutorisés = input.chantierIds.filter((id) =>
        ctx.session.habilitations.lecture.chantiers.includes(id),
      );
      return getContainer("chantiers")
        .resolve("getRepartitionMeteoChantiersQuery")
        .execute({
          chantierIds: chantierIdsAutorisés,
          territoireCode: input.territoireCode,
        });
    }),
  recupererChantiersSignales: procédureProtégée
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        territoireCode: z.string(),
        jalonParDefaut: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      const chantierIdsAutorisés = input.chantierIds.filter((id) =>
        ctx.session.habilitations.lecture.chantiers.includes(id),
      );
      return getContainer("chantiers")
        .resolve("getChantiersSignalesQuery")
        .execute({
          chantierIds: chantierIdsAutorisés,
          territoireCode: input.territoireCode,
          jalonParDefaut: input.jalonParDefaut,
        });
    }),
  recupererAvancementChantier: procédureProtégée
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
  recupererSituationChantier: procédureProtégée
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
  recupererStatistiquesAvancement: procédureProtégée
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        maille: z.enum(["regionale", "departementale"]),
        jalon: z.number(),
      }),
    )
    .query(({ input, ctx }) => {
      return getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .run(
          input.chantierIds,
          input.maille,
          ctx.session.habilitations,
          input.jalon,
        );
    }),
  recupererTauxAvancementTerritoire: procédureProtégée
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
  recupererStatistiquesAvancementTousChantiersPublies: procédureProtégée
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
  recupererChantiersEnRetard: procédureProtégée
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
        .resolve("getChantiersEnRetardQuery")
        .execute(input);
    }),
  recupererChantiersEnDifficulte: procédureProtégée
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
        .resolve("getChantiersEnDifficulteQuery")
        .execute(input);
    }),
  recupererIndicateursChantier: procédureProtégée
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
