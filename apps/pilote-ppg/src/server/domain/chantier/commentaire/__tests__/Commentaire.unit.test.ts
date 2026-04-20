import { $Enums } from "@prisma/client";
import { CommentaireV2 } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  creerCommentairePublie,
  creerCommentaireBrouillon,
  publierBrouillonCommentaire,
  modifierCommentairePublie,
  modifierCommentaireBrouillon,
} from "@/server/domain/chantier/commentaire/Commentaire";

const paramsModification = {
  contenu: "nouveau contenu",
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
};

function commentaireAvecStatut(
  statut: $Enums.statut_publication,
): CommentaireV2 {
  return {
    id: "commentaire-1",
    chantierId: "chantier-1",
    territoireCode: "REG-01",
    type: "risquesEtFreinsÀLever",
    contenu: "contenu initial",
    statut,
    auteurCreationId: "auteur-1",
    dateCreation: "2026-01-01",
    auteurModificationId: "auteur-1",
    dateModification: "2026-01-01",
  };
}

const paramsCreation = {
  chantierId: "chantier-1",
  territoireCode: "REG-01",
  type: "risquesEtFreinsÀLever" as const,
  contenu: "contenu initial",
  auteurId: "auteur-1",
  date: "2026-01-01",
};

describe("creerCommentairePublie", () => {
  it("crée un commentaire avec statut PUBLIE", () => {
    // when
    const result = creerCommentairePublie(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        territoireCode: paramsCreation.territoireCode,
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

describe("creerCommentaireBrouillon", () => {
  it("crée un commentaire avec statut BROUILLON", () => {
    // when
    const result = creerCommentaireBrouillon(paramsCreation);

    // then
    expect(result).toEqual(
      expect.objectContaining({
        chantierId: paramsCreation.chantierId,
        territoireCode: paramsCreation.territoireCode,
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

describe("publierBrouillonCommentaire", () => {
  it("publie un brouillon et retourne un commentaire PUBLIE", () => {
    // given
    const brouillon = commentaireAvecStatut(
      $Enums.statut_publication.BROUILLON,
    );

    // when
    const result = publierBrouillonCommentaire(brouillon, paramsModification);

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette un commentaire déjà PUBLIE", () => {
    // given
    const publie = commentaireAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() =>
      publierBrouillonCommentaire(publie, paramsModification),
    ).toThrow("Statut invalide : attendu BROUILLON, reçu PUBLIE");
  });
});

describe("modifierCommentairePublie", () => {
  it("modifie un commentaire PUBLIE et retourne un commentaire PUBLIE", () => {
    // given
    const publie = commentaireAvecStatut($Enums.statut_publication.PUBLIE);

    // when
    const result = modifierCommentairePublie(publie, paramsModification);

    // then
    expect(result).toEqual({
      ...publie,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.PUBLIE,
    });
  });

  it("rejette un commentaire BROUILLON", () => {
    // given
    const brouillon = commentaireAvecStatut(
      $Enums.statut_publication.BROUILLON,
    );

    // then
    expect(() =>
      modifierCommentairePublie(brouillon, paramsModification),
    ).toThrow("Statut invalide : attendu PUBLIE, reçu BROUILLON");
  });
});

describe("modifierCommentaireBrouillon", () => {
  it("modifie un brouillon et retourne un commentaire BROUILLON", () => {
    // given
    const brouillon = commentaireAvecStatut(
      $Enums.statut_publication.BROUILLON,
    );

    // when
    const result = modifierCommentaireBrouillon(brouillon, paramsModification);

    // then
    expect(result).toEqual({
      ...brouillon,
      contenu: paramsModification.contenu,
      auteurModificationId: paramsModification.auteurModificationId,
      dateModification: paramsModification.dateModification,
      statut: $Enums.statut_publication.BROUILLON,
    });
  });

  it("rejette un commentaire PUBLIE", () => {
    // given
    const publie = commentaireAvecStatut($Enums.statut_publication.PUBLIE);

    // then
    expect(() =>
      modifierCommentaireBrouillon(publie, paramsModification),
    ).toThrow("Statut invalide : attendu BROUILLON, reçu PUBLIE");
  });
});
