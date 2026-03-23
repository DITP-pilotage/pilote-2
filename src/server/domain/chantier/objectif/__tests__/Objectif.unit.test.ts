import { $Enums } from "@prisma/client";
import { ObjectifV2 } from "@/server/domain/chantier/objectif/Objectif.interface";
import {
  creerObjectifPublie,
  creerObjectifBrouillon,
  publierBrouillonObjectif,
  modifierObjectifPublie,
  modifierObjectifBrouillon,
} from "@/server/domain/chantier/objectif/Objectif";

const paramsCreation = {
  chantierId: "chantier-1",
  type: "notreAmbition" as const,
  contenu: "contenu initial",
  auteurId: "auteur-1",
  date: "2026-01-01",
};

const paramsModification = {
  contenu: "nouveau contenu",
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
};

function objectifAvecStatut(statut: $Enums.statut_publication): ObjectifV2 {
  return {
    id: "objectif-1",
    chantierId: "chantier-1",
    type: "notreAmbition",
    contenu: "contenu initial",
    statut,
    auteurCreationId: "auteur-1",
    dateCreation: "2026-01-01",
    auteurModificationId: "auteur-1",
    dateModification: "2026-01-01",
  };
}

describe("creerObjectifPublie", () => {
  it("crée un objectif avec statut PUBLIE", () => {
    // when
    const result = creerObjectifPublie(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        type: paramsCreation.type,
        contenu: paramsCreation.contenu,
        auteurCreationId: paramsCreation.auteurId,
        auteurModificationId: paramsCreation.auteurId,
        dateCreation: paramsCreation.date,
        dateModification: paramsCreation.date,
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });
});

describe("creerObjectifBrouillon", () => {
  it("crée un objectif avec statut BROUILLON", () => {
    // when
    const result = creerObjectifBrouillon(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        type: paramsCreation.type,
        contenu: paramsCreation.contenu,
        auteurCreationId: paramsCreation.auteurId,
        auteurModificationId: paramsCreation.auteurId,
        dateCreation: paramsCreation.date,
        dateModification: paramsCreation.date,
        statut: $Enums.statut_publication.BROUILLON,
      }),
    );
  });
});

describe("publierBrouillonObjectif", () => {
  it("publie un brouillon et retourne un objectif PUBLIE", () => {
    // given
    const brouillon = objectifAvecStatut($Enums.statut_publication.BROUILLON);

    // when
    const result = publierBrouillonObjectif(brouillon, paramsModification);

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette un objectif déjà PUBLIE", () => {
    // given
    const publie = objectifAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() => publierBrouillonObjectif(publie, paramsModification)).toThrow(
      "Statut invalide : attendu BROUILLON, reçu PUBLIE",
    );
  });
});

describe("modifierObjectifPublie", () => {
  it("modifie un objectif PUBLIE et retourne un objectif PUBLIE", () => {
    // given
    const publie = objectifAvecStatut($Enums.statut_publication.PUBLIE);

    // when
    const result = modifierObjectifPublie(publie, paramsModification);

    // then
    expect(result).toEqual({
      ...publie,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette un objectif BROUILLON", () => {
    // given
    const brouillon = objectifAvecStatut($Enums.statut_publication.BROUILLON);

    // then
    expect(() => modifierObjectifPublie(brouillon, paramsModification)).toThrow(
      "Statut invalide : attendu PUBLIE, reçu BROUILLON",
    );
  });
});

describe("modifierObjectifBrouillon", () => {
  it("modifie un brouillon et retourne un objectif BROUILLON", () => {
    // given
    const brouillon = objectifAvecStatut($Enums.statut_publication.BROUILLON);

    // when
    const result = modifierObjectifBrouillon(brouillon, paramsModification);

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.BROUILLON,
    });
  });

  it("rejette un objectif PUBLIE", () => {
    // given
    const publie = objectifAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() => modifierObjectifBrouillon(publie, paramsModification)).toThrow(
      "Statut invalide : attendu BROUILLON, reçu PUBLIE",
    );
  });
});
