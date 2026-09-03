import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantierCommentairesQuery } from "@/server/chantiers/query/GetChantierCommentairesQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";
const TYPES_NATIONAUX = [
  "freins_a_lever",
  "actions_a_venir",
  "actions_a_valoriser",
  "autres_resultats_obtenus_non_correles_aux_indicateurs",
  "decision_strategique",
] as const;

describe("GetChantierCommentairesQuery", () => {
  let query: GetChantierCommentairesQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetChantierCommentairesQuery({ prisma: prismaPilote });
  });

  it(
    "retourne les commentaires publiés des types demandés sans données auteur",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      const commentaire = await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: "commentaires_sur_les_donnees",
        contenu: "Commentaire sur les données",
        date_modification: new Date("2025-06-01"),
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["commentaires_sur_les_donnees"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result).toEqual({
        resultats: [
          {
            territoire_code: TERRITOIRE_CODE,
            territoire_nom: expect.any(String),
            chantier_id: chantier.id,
            commentaires: [
              {
                id: commentaire.id,
                date_publication: new Date("2025-06-01").toISOString(),
                contenu: "Commentaire sur les données",
                type: "commentaires_sur_les_donnees",
              },
            ],
          },
        ],
        types_non_accessibles: [],
      });
    }),
  );

  it(
    "exclut les commentaires en brouillon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: "commentaires_sur_les_donnees",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["commentaires_sur_les_donnees"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats[0].commentaires).toEqual([]);
    }),
  );

  it(
    "ne retourne pas les commentaires des types non demandés",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      const commentaireDemandé = await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: "commentaires_sur_les_donnees",
      });
      // Un commentaire d'un autre type sur le même couple chantier × territoire
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: "autres_resultats_obtenus",
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["commentaires_sur_les_donnees"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats[0].commentaires.map((item) => item.id)).toEqual([
        commentaireDemandé.id,
      ]);
    }),
  );

  it(
    "inclut la synthèse des résultats quand synthese_des_resultats est demandé",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      const synthese = await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        commentaire: "Analyse de la synthèse",
        date_modification: new Date("2025-03-01"),
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["synthese_des_resultats"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats[0].commentaires).toEqual([
        {
          id: synthese.id,
          date_publication: new Date("2025-03-01").toISOString(),
          contenu: "Analyse de la synthèse",
          type: "synthese_des_resultats",
        },
      ]);
    }),
  );

  it(
    "n'inclut pas la synthèse des résultats quand elle n'est pas demandée",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["commentaires_sur_les_donnees"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats[0].commentaires).toEqual([]);
    }),
  );

  it(
    "exclut les synthèses des résultats sans commentaire",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      // Une synthèse avec météo mais sans commentaire textuel
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        commentaire: null,
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["synthese_des_resultats"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats[0].commentaires).toEqual([]);
    }),
  );

  it(
    "inclut les décisions stratégiques publiées quand decision_strategique est demandé",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
      });
      const decision = await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        contenu: "Décision Élysée-Matignon",
        date_modification: new Date("2025-04-01"),
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: ["NAT-FR"],
        types: ["decision_strategique"],
        inclureCommentairesNationaux: true,
      });

      // Then
      expect(result.resultats[0].commentaires).toEqual([
        {
          id: decision.id,
          date_publication: new Date("2025-04-01").toISOString(),
          contenu: "Décision Élysée-Matignon",
          type: "decision_strategique",
        },
      ]);
    }),
  );

  it(
    "exclut les décisions stratégiques en brouillon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
      });
      await fixtures.decisionStrategique({
        chantier_id: chantier.id,
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: ["NAT-FR"],
        types: ["decision_strategique"],
        inclureCommentairesNationaux: true,
      });

      // Then
      expect(result.resultats[0].commentaires).toEqual([]);
    }),
  );

  it(
    "trie les contenus par date de publication décroissante",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      const ancien = await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: "commentaires_sur_les_donnees",
        date_modification: new Date("2025-01-01"),
      });
      const récente = await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        date_modification: new Date("2025-06-01"),
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["commentaires_sur_les_donnees", "synthese_des_resultats"],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats[0].commentaires.map((item) => item.id)).toEqual([
        récente.id,
        ancien.id,
      ]);
    }),
  );

  it(
    "remonte les types nationaux sur NAT-FR quand ils sont demandés depuis un territoire local et accessibles",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
      });
      const commentaireNational = await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
        type: "freins_a_lever",
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: ["freins_a_lever"],
        inclureCommentairesNationaux: true,
      });

      // Then
      expect(result.types_non_accessibles).toEqual([]);
      expect(result.resultats).toHaveLength(1);
      expect(result.resultats[0]).toMatchObject({
        territoire_code: "NAT-FR",
        territoire_nom: expect.any(String),
        chantier_id: chantier.id,
      });
      expect(result.resultats[0].commentaires.map((item) => item.id)).toEqual([
        commentaireNational.id,
      ]);
    }),
  );

  it(
    "signale les types nationaux non accessibles sans interroger NAT-FR",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: [TERRITOIRE_CODE],
        types: [...TYPES_NATIONAUX],
        inclureCommentairesNationaux: false,
      });

      // Then
      expect(result.resultats).toEqual([]);
      expect(result.types_non_accessibles).toEqual([...TYPES_NATIONAUX]);
    }),
  );

  it(
    "ne duplique pas NAT-FR quand le territoire national est déjà dans le périmètre",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        maille: "NAT",
        code_insee: "FR",
      });
      const decision = await fixtures.decisionStrategique({
        chantier_id: chantier.id,
      });

      // When
      const result = await query.execute({
        chantierId: chantier.id,
        territoireCodes: ["NAT-FR"],
        types: ["decision_strategique"],
        inclureCommentairesNationaux: true,
      });

      // Then
      expect(result.resultats).toHaveLength(1);
      expect(result.resultats[0].territoire_code).toBe("NAT-FR");
      expect(result.resultats[0].commentaires.map((item) => item.id)).toEqual([
        decision.id,
      ]);
    }),
  );
});
