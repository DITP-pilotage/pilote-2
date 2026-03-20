import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import { ObjectifV2 } from "@/server/domain/chantier/objectif/Objectif.interface";
import { PublierBrouillonObjectifUseCase } from "@/server/objectifs/usecases/PublierBrouillonObjectifUseCase";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

const habilitationsAvecAcces = {
  saisieCommentaire: {
    chantiers: ["chantier-1"],
    territoires: ["NAT-FR"],
    périmètres: [],
  },
  lecture: { chantiers: [], territoires: [], périmètres: [] },
  saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
  responsabilite: { chantiers: [], territoires: [], périmètres: [] },
  gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
} as Habilitations;

const input = {
  brouillonId: "objectif-1",
  contenu: "nouveau contenu",
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
  habilitations: habilitationsAvecAcces,
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

describe("PublierBrouillonObjectifUseCase", () => {
  let useCase: PublierBrouillonObjectifUseCase;
  let objectifRepository: MockProxy<ObjectifRepository>;

  beforeEach(() => {
    objectifRepository = mock<ObjectifRepository>();
    useCase = new PublierBrouillonObjectifUseCase({ objectifRepository });
  });

  it("publie un brouillon et le sauvegarde en PUBLIE", async () => {
    // given
    objectifRepository.getById.mockResolvedValue(
      objectifAvecStatut($Enums.statut_publication.BROUILLON),
    );

    // when
    await useCase.execute(input);

    // then
    expect(objectifRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "objectif-1",
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });

  it("rejette un ID introuvable sans appeler save", async () => {
    // given
    objectifRepository.getById.mockResolvedValue(null);

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Brouillon introuvable",
    );
    expect(objectifRepository.save).not.toHaveBeenCalled();
  });

  it("rejette un objectif déjà PUBLIE sans appeler save", async () => {
    // given - l'ID passé comme brouillonId correspond en réalité à un objectif publié
    objectifRepository.getById.mockResolvedValue(
      objectifAvecStatut($Enums.statut_publication.PUBLIE),
    );

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Statut invalide : attendu BROUILLON, reçu PUBLIE",
    );
    expect(objectifRepository.save).not.toHaveBeenCalled();
  });
});
