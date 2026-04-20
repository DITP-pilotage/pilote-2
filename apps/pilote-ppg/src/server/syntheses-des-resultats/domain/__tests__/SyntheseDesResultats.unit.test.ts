import { $Enums } from "@prisma/client";
import { SyntheseDesResultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import {
  creerSyntheseDesResultatsPublie,
  creerSyntheseDesResultatsBrouillon,
  publierBrouillonSyntheseDesResultats,
  modifierSyntheseDesResultatsPubliee,
  modifierSyntheseDesResultatsBrouillon,
} from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";

const paramsCreation = {
  chantierId: "chantier-1",
  territoireCode: "NAT-FR",
  contenu: "contenu initial",
  meteo: "COUVERT" as const,
  auteurId: "auteur-1",
  date: "2026-01-01",
};

const paramsModification = {
  contenu: "nouveau contenu",
  meteo: "SOLEIL" as const,
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
};

function syntheseAvecStatut(
  statut: $Enums.statut_publication,
): SyntheseDesResultatsV2 {
  return {
    id: "synthese-1",
    chantierId: "chantier-1",
    territoireCode: "NAT-FR",
    contenu: "contenu initial",
    meteo: "COUVERT",
    statut,
    auteurCreationId: "auteur-1",
    dateCreation: "2026-01-01",
    auteurModificationId: "auteur-1",
    dateModification: "2026-01-01",
  };
}

describe("creerSyntheseDesResultatsPublie", () => {
  it("crée une synthèse avec statut PUBLIE", () => {
    // when
    const result = creerSyntheseDesResultatsPublie(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        territoireCode: paramsCreation.territoireCode,
        contenu: paramsCreation.contenu,
        meteo: paramsCreation.meteo,
        auteurCreationId: paramsCreation.auteurId,
        auteurModificationId: paramsCreation.auteurId,
        dateCreation: paramsCreation.date,
        dateModification: paramsCreation.date,
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });
});

describe("creerSyntheseDesResultatsBrouillon", () => {
  it("crée une synthèse avec statut BROUILLON", () => {
    // when
    const result = creerSyntheseDesResultatsBrouillon(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        territoireCode: paramsCreation.territoireCode,
        contenu: paramsCreation.contenu,
        meteo: paramsCreation.meteo,
        auteurCreationId: paramsCreation.auteurId,
        auteurModificationId: paramsCreation.auteurId,
        dateCreation: paramsCreation.date,
        dateModification: paramsCreation.date,
        statut: $Enums.statut_publication.BROUILLON,
      }),
    );
  });
});

describe("publierBrouillonSyntheseDesResultats", () => {
  it("publie un brouillon et retourne une synthèse PUBLIE", () => {
    // given
    const brouillon = syntheseAvecStatut($Enums.statut_publication.BROUILLON);

    // when
    const result = publierBrouillonSyntheseDesResultats(
      brouillon,
      paramsModification,
    );

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      meteo: paramsModification.meteo,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette une synthèse déjà PUBLIE", () => {
    // given
    const publie = syntheseAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() =>
      publierBrouillonSyntheseDesResultats(publie, paramsModification),
    ).toThrow("Statut invalide : attendu BROUILLON, reçu PUBLIE");
  });
});

describe("modifierSyntheseDesResultatsPubliee", () => {
  it("modifie une synthèse PUBLIE et retourne une synthèse PUBLIE", () => {
    // given
    const publie = syntheseAvecStatut($Enums.statut_publication.PUBLIE);

    // when
    const result = modifierSyntheseDesResultatsPubliee(
      publie,
      paramsModification,
    );

    // then
    expect(result).toEqual({
      ...publie,
      contenu: paramsModification.contenu,
      meteo: paramsModification.meteo,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette une synthèse BROUILLON", () => {
    // given
    const brouillon = syntheseAvecStatut($Enums.statut_publication.BROUILLON);

    // then
    expect(() =>
      modifierSyntheseDesResultatsPubliee(brouillon, paramsModification),
    ).toThrow("Statut invalide : attendu PUBLIE, reçu BROUILLON");
  });
});

describe("modifierSyntheseDesResultatsBrouillon", () => {
  it("modifie un brouillon et retourne une synthèse BROUILLON", () => {
    // given
    const brouillon = syntheseAvecStatut($Enums.statut_publication.BROUILLON);

    // when
    const result = modifierSyntheseDesResultatsBrouillon(
      brouillon,
      paramsModification,
    );

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      meteo: paramsModification.meteo,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.BROUILLON,
    });
  });

  it("rejette une synthèse PUBLIE", () => {
    // given
    const publie = syntheseAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() =>
      modifierSyntheseDesResultatsBrouillon(publie, paramsModification),
    ).toThrow("Statut invalide : attendu BROUILLON, reçu PUBLIE");
  });
});
