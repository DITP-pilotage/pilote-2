import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";

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
  recupererPVATerritoires: procédureProtégée
    .input(
      z.object({
        chantierId: z.string(),
        jalon: z.number(),
      }),
    )
    .query(({ input }) => {
      return getContainer("chantiers")
        .resolve("getChantierPVATerritoiresQuery")
        .execute(input);
    }),
  recupererAvancementsTerritoires: procédureProtégée
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
        .resolve("recupererAvancementsTerritoiresQuery")
        .run({ chantierIds: chantierIdsAutorisés, jalon: input.jalon });
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
      return getContainer("legacy")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .run(
          input.chantierIds,
          input.maille,
          ctx.session.habilitations,
          input.jalon,
        );
    }),
});
