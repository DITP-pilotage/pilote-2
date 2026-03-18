import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { AvancementTerritoireViewModel } from "@/server/chantiers/app/contrats/AvancementTerritoireContrat";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

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
  recupererAvancementsTerritoires: procédureProtégée
    .input(
      z.object({
        chantierIds: z.array(z.string()),
        jalon: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const agregat = await getContainer("legacy")
        .resolve("agregerAvancementsChantiersUseCase")
        .run(input.chantierIds, input.jalon);

      const territoires = await getContainer("chantiers")
        .resolve("territoireRepository")
        .récupérerTousNew();
      const territoiresMap = new Map(
        territoires.map((territoire) => [territoire.code, territoire]),
      );

      const result: AvancementTerritoireViewModel[] = [];

      const mailleMapping: Array<{
        maille: keyof typeof agregat;
        mailleCode: MailleTerritoireSelectionne;
      }> = [
        { maille: "nationale", mailleCode: "NAT" },
        { maille: "regionale", mailleCode: "REG" },
        { maille: "departementale", mailleCode: "DEPT" },
      ];

      for (const { maille, mailleCode } of mailleMapping) {
        for (const [territoireCode, territoire] of Object.entries(
          agregat[maille].territoires,
        )) {
          result.push({
            territoireCode,
            territoireNom: territoiresMap.get(territoireCode)?.nomAffiché ?? "",
            codeInsee: territoireCode,
            maille: mailleCode,
            avancementAnnuel: territoire.repartition.avancements.annuel.moyenne,
            estApplicable: null,
            dateTauxAvancementAnnuel: territoire.dateTauxAvancementAnnuel,
          });
        }
      }

      return result;
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
