import { $Enums } from "@prisma/client";
import { randomUUID } from "crypto";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { RecupererChantiersApplicablesParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersApplicablesParTerritoiresQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("RecupererChantiersApplicablesParTerritoiresQuery", () => {
  let query: RecupererChantiersApplicablesParTerritoiresQuery;

  beforeEach(() => {
    query = new RecupererChantiersApplicablesParTerritoiresQuery({
      prisma: new PrismaPilote(),
    });
  });

  describe("execute", () => {
    it("retourne les chantiers où est_territorialise = true et est_applicable = true pour les territoires donnés", async () => {
      // given
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier accessible",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur accessible",
        statut: $Enums.type_statut_indicateur.PUBLIE,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire.code],
      });

      // then
      expect(result).toEqual({
        [chantier.id]: {
          id: chantier.id,
          nom: "Chantier accessible",
          indicateurs: [
            {
              id: indicateur.id,
              nom: "Indicateur accessible",
              territoiresApplicables: [territoire.code],
            },
          ],
        },
      });
    });

    it("exclut les chantiers où est_territorialise = false", async () => {
      // given
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier non territorialisé",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: false,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
        est_applicable: true,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire.code],
      });

      // then
      expect(result).toEqual({});
    });

    it("exclut les chantiers où est_applicable = false pour les territoires donnés", async () => {
      // given
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier non applicable",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
        est_applicable: false,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire.code],
      });

      // then
      expect(result).toEqual({});
    });

    it("retourne uniquement les indicateurs où est_applicable = true pour les territoires donnés", async () => {
      // given
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier accessible",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
        est_applicable: true,
      });

      const indicateurAccessible = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur accessible",
        statut: $Enums.type_statut_indicateur.PUBLIE,
      });

      await fixtures.indicateurTerritoire({
        id: indicateurAccessible.id,
        territoire_code: territoire.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      const indicateurNonAccessible = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur non accessible",
        statut: $Enums.type_statut_indicateur.PUBLIE,
      });

      await fixtures.indicateurTerritoire({
        id: indicateurNonAccessible.id,
        territoire_code: territoire.code,
        chantier_id: chantier.id,
        est_applicable: false,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire.code],
      });

      // then
      expect(result).toEqual({
        [chantier.id]: {
          id: chantier.id,
          nom: "Chantier accessible",
          indicateurs: [
            {
              id: indicateurAccessible.id,
              nom: "Indicateur accessible",
              territoiresApplicables: [territoire.code],
            },
          ],
        },
      });
    });

    it("gère correctement plusieurs territoires", async () => {
      // given
      const territoire1 = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoire2 = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier multi-territoires",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire1.code,
        est_applicable: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire2.code,
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur multi-territoires",
        statut: $Enums.type_statut_indicateur.PUBLIE,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire1.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire2.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire1.code, territoire2.code],
      });

      // then
      expect(result).toEqual({
        [chantier.id]: {
          id: chantier.id,
          nom: "Chantier multi-territoires",
          indicateurs: [
            {
              id: indicateur.id,
              nom: "Indicateur multi-territoires",
              territoiresApplicables: expect.arrayContaining([
                territoire1.code,
                territoire2.code,
              ]),
            },
          ],
        },
      });
    });

    it("exclut les chantiers avec statut BROUILLON", async () => {
      // given
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier brouillon",
        statut: $Enums.type_statut.BROUILLON,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
        est_applicable: true,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire.code],
      });

      // then
      expect(result).toEqual({});
    });

    it("exclut les indicateurs avec statut SUPPRIME", async () => {
      // given
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier accessible",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur brouillon",
        statut: $Enums.type_statut_indicateur.SUPPRIME,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire.code],
      });

      // then
      expect(result).toEqual({
        [chantier.id]: {
          id: chantier.id,
          nom: "Chantier accessible",
          indicateurs: [],
        },
      });
    });

    it("retourne uniquement les territoires applicables demandés pour chaque indicateur", async () => {
      // given
      const territoire1 = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoire2 = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
      });

      const territoire3 = await fixtures.territoire({
        code: randomUUID(),
        nom: "Hauts-de-Seine",
        maille: "DEPT",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier",
        statut: $Enums.type_statut.PUBLIE,
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire1.code,
        est_applicable: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire2.code,
        est_applicable: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire3.code,
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur",
        statut: $Enums.type_statut_indicateur.PUBLIE,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire1.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire2.code,
        chantier_id: chantier.id,
        est_applicable: true,
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire3.code,
        chantier_id: chantier.id,
        est_applicable: false,
      });

      // when
      const result = await query.execute({
        territoireCodes: [territoire1.code, territoire2.code, territoire3.code],
      });

      // then
      expect(result).toEqual({
        [chantier.id]: {
          id: chantier.id,
          nom: "Chantier",
          indicateurs: [
            {
              id: indicateur.id,
              nom: "Indicateur",
              territoiresApplicables: expect.arrayContaining([
                territoire1.code,
                territoire2.code,
              ]),
            },
          ],
        },
      });
      expect(
        result[chantier.id].indicateurs[0].territoiresApplicables,
      ).not.toContain(territoire3.code);
    });
  });
});
