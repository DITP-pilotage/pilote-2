import { randomUUID } from "node:crypto";
import { $Enums } from "@prisma/client";
import { PrismaUtilisateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaUtilisateurRepository";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ListerResponsablesAnnuaireQuery } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const RHONE = {
  code: "DEPT-69",
  nom: "69 - Rhône",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
const AUVERGNE_RHONE_ALPES = {
  code: "REG-84",
  nom: "Auvergne-Rhône-Alpes",
  maille: $Enums.Maille.REG,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
const NORD = {
  code: "DEPT-59",
  nom: "59 - Nord",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-32",
  regionNom: "Hauts-de-France",
};

describe("ListerResponsablesAnnuaireQuery", () => {
  let query: ListerResponsablesAnnuaireQuery;

  beforeEach(() => {
    query = new ListerResponsablesAnnuaireQuery({
      prisma: new PrismaPilote(),
      utilisateurRepository: new PrismaUtilisateurRepository(),
    });
  });

  it(
    "renvoie plusieurs responsables par couple, une personne sur plusieurs couples, y compris un couple non applicable",
    createIntegrationTest(async () => {
      // Given
      const lea = await fixtures.utilisateur({
        prenom: "Léa",
        nom: "Girard",
        email: "lea.girard@rhone.gouv.fr",
      });
      const hugo = await fixtures.utilisateur({
        prenom: "Hugo",
        nom: "Perrin",
        email: "hugo.perrin@developpement-durable.gouv.fr",
      });
      const chantier = await fixtures.chantierIdentite({
        nom: "Rénovation énergétique",
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-69",
        maille: $Enums.Maille.DEPT,
        est_applicable: true,
        responsables_locaux_ids: [lea.id, hugo.id],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "REG-84",
        maille: $Enums.Maille.REG,
        est_applicable: false,
        responsables_locaux_ids: [hugo.id],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-03",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [],
      });
      const chantierAnnuaire = {
        id: chantier.id,
        nom: "Rénovation énergétique",
      };

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual({
        personnes: [
          {
            id: lea.id,
            prenom: "Léa",
            nom: "Girard",
            email: "lea.girard@rhone.gouv.fr",
            fonction: null,
            service: null,
          },
          {
            id: hugo.id,
            prenom: "Hugo",
            nom: "Perrin",
            email: "hugo.perrin@developpement-durable.gouv.fr",
            fonction: null,
            service: null,
          },
        ],
        affectations: [
          { personneId: lea.id, chantier: chantierAnnuaire, territoire: RHONE },
          {
            personneId: hugo.id,
            chantier: chantierAnnuaire,
            territoire: RHONE,
          },
          {
            personneId: hugo.id,
            chantier: chantierAnnuaire,
            territoire: AUVERGNE_RHONE_ALPES,
          },
        ],
      });
    }),
  );

  it(
    "ne renvoie que les chantiers publiés et exclut une personne responsable uniquement sur des chantiers non publiés",
    createIntegrationTest(async () => {
      // Given
      const julie = await fixtures.utilisateur({ prenom: "Julie" });
      const karim = await fixtures.utilisateur({ prenom: "Karim" });
      const publie = await fixtures.chantierIdentite({
        nom: "Chantier publié",
        statut: $Enums.type_statut.PUBLIE,
      });
      const brouillon = await fixtures.chantierIdentite({
        nom: "Chantier brouillon",
        statut: $Enums.type_statut.BROUILLON,
      });
      await fixtures.chantierTerritoire({
        id: publie.id,
        territoire_code: "DEPT-59",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [julie.id],
      });
      // julie a aussi un chantier en brouillon, karim n'a que celui-là
      await fixtures.chantierTerritoire({
        id: brouillon.id,
        territoire_code: "DEPT-59",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [julie.id, karim.id],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.personnes.map((personne) => personne.id)).toEqual([
        julie.id,
      ]);
      expect(resultat.affectations).toEqual([
        {
          personneId: julie.id,
          chantier: { id: publie.id, nom: "Chantier publié" },
          territoire: NORD,
        },
      ]);
    }),
  );

  it(
    "ignore les identifiants inconnus ou malformés et garde les utilisateurs désactivés",
    createIntegrationTest(async () => {
      // Given
      const julie = await fixtures.utilisateur({ prenom: "Julie" });
      const desactive = await fixtures.utilisateur({
        date_desactivation: new Date("2026-01-01"),
      });
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier publié",
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-59",
        maille: $Enums.Maille.DEPT,
        responsables_locaux_ids: [
          randomUUID(),
          "pas-un-uuid",
          desactive.id,
          julie.id,
        ],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.affectations).toEqual([
        {
          personneId: desactive.id,
          chantier: { id: chantier.id, nom: "Chantier publié" },
          territoire: NORD,
        },
        {
          personneId: julie.id,
          chantier: { id: chantier.id, nom: "Chantier publié" },
          territoire: NORD,
        },
      ]);
    }),
  );
});
