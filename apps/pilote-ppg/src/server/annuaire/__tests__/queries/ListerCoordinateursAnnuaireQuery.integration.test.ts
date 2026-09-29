import { randomUUID } from "node:crypto";
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerCoordinateursAnnuaireQuery } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const AIN = {
  code: "DEPT-01",
  nom: "01 - Ain",
  maille: $Enums.Maille.DEPT,
  regionCode: "REG-84",
  regionNom: "Auvergne-Rhône-Alpes",
};
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

describe("ListerCoordinateursAnnuaireQuery", () => {
  let query: ListerCoordinateursAnnuaireQuery;

  beforeEach(() => {
    query = new ListerCoordinateursAnnuaireQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "renvoie plusieurs coordinateurs par territoire et plusieurs territoires par coordinateur",
    createIntegrationTest(async () => {
      // Given
      const sophie = await fixtures.utilisateur({
        prenom: "Sophie",
        nom: "Bernard",
        email: "sophie.bernard@rhone.gouv.fr",
        fonction: "Coordinatrice PILOTE",
        service: "autre",
        service_autre: "Préfecture du Rhône",
      });
      const thomas = await fixtures.utilisateur({
        prenom: "Thomas",
        nom: "Nguyen",
        email: "thomas.nguyen@rhone.gouv.fr",
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-01",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [thomas.id],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-69",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [sophie.id, thomas.id],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual({
        personnes: [
          {
            id: thomas.id,
            prenom: "Thomas",
            nom: "Nguyen",
            email: "thomas.nguyen@rhone.gouv.fr",
            fonction: null,
            service: null,
          },
          {
            id: sophie.id,
            prenom: "Sophie",
            nom: "Bernard",
            email: "sophie.bernard@rhone.gouv.fr",
            fonction: "Coordinatrice PILOTE",
            service: "Préfecture du Rhône",
          },
        ],
        affectations: [
          { personneId: thomas.id, territoire: AIN },
          { personneId: sophie.id, territoire: RHONE },
          { personneId: thomas.id, territoire: RHONE },
        ],
      });
    }),
  );

  it(
    "ne renvoie qu'une fois un territoire présent sur plusieurs chantiers et exclut les territoires sans coordinateur et le national",
    createIntegrationTest(async () => {
      // Given
      const camille = await fixtures.utilisateur({ prenom: "Camille" });
      const premierChantier = await fixtures.chantierIdentite();
      const secondChantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "REG-84",
        maille: $Enums.Maille.REG,
        coordinateurs_territoriaux_ids: [camille.id],
      });
      await fixtures.chantierTerritoire({
        id: secondChantier.id,
        territoire_code: "REG-84",
        maille: $Enums.Maille.REG,
        coordinateurs_territoriaux_ids: [camille.id],
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "DEPT-03",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [],
      });
      await fixtures.chantierTerritoire({
        id: premierChantier.id,
        territoire_code: "NAT-FR",
        maille: $Enums.Maille.NAT,
        coordinateurs_territoriaux_ids: [camille.id],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.affectations).toEqual([
        { personneId: camille.id, territoire: AUVERGNE_RHONE_ALPES },
      ]);
    }),
  );

  it(
    "ignore les identifiants inconnus ou malformés et garde les utilisateurs désactivés",
    createIntegrationTest(async () => {
      // Given
      const camille = await fixtures.utilisateur({ prenom: "Camille" });
      const desactive = await fixtures.utilisateur({
        date_desactivation: new Date("2026-01-01"),
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-01",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [
          randomUUID(),
          "pas-un-uuid",
          desactive.id,
          camille.id,
        ],
      });
      // territoire dont le seul coordinateur n'existe plus : doit disparaître
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-03",
        maille: $Enums.Maille.DEPT,
        coordinateurs_territoriaux_ids: [randomUUID()],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.personnes.map((personne) => personne.id)).toEqual([
        desactive.id,
        camille.id,
      ]);
      expect(resultat.affectations).toEqual([
        { personneId: desactive.id, territoire: AIN },
        { personneId: camille.id, territoire: AIN },
      ]);
    }),
  );
});
