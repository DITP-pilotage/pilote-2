import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { CommentaireV2 } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { PublierBrouillonCommentaireUseCase } from "@/server/commentaires/usecases/PublierBrouillonCommentaireUseCase";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

const habilitationsAvecAcces = {
  saisieCommentaire: {
    chantiers: ["chantier-1"],
    territoires: ["REG-01"],
    périmètres: [],
  },
  lecture: { chantiers: [], territoires: [], périmètres: [] },
  saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
  responsabilite: { chantiers: [], territoires: [], périmètres: [] },
  gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
} as Habilitations;

const input = {
  brouillonId: "commentaire-1",
  contenu: "nouveau contenu",
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
  habilitations: habilitationsAvecAcces,
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

describe("PublierBrouillonCommentaireUseCase", () => {
  let useCase: PublierBrouillonCommentaireUseCase;
  let commentaireRepository: MockProxy<CommentaireRepository>;

  beforeEach(() => {
    commentaireRepository = mock<CommentaireRepository>();
    useCase = new PublierBrouillonCommentaireUseCase({ commentaireRepository });
  });

  it("publie un brouillon et le sauvegarde en PUBLIE", async () => {
    // given
    commentaireRepository.getById.mockResolvedValue(
      commentaireAvecStatut($Enums.statut_publication.BROUILLON),
    );

    // when
    await useCase.execute(input);

    // then
    expect(commentaireRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "commentaire-1",
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });

  it("rejette un ID introuvable sans appeler save", async () => {
    // given
    commentaireRepository.getById.mockResolvedValue(null);

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Brouillon introuvable",
    );
    expect(commentaireRepository.save).not.toHaveBeenCalled();
  });

  it("rejette un commentaire déjà PUBLIE sans appeler save", async () => {
    // given - l'ID passé comme brouillonId correspond en réalité à un commentaire publié
    commentaireRepository.getById.mockResolvedValue(
      commentaireAvecStatut($Enums.statut_publication.PUBLIE),
    );

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Statut invalide : attendu BROUILLON, reçu PUBLIE",
    );
    expect(commentaireRepository.save).not.toHaveBeenCalled();
  });
});
