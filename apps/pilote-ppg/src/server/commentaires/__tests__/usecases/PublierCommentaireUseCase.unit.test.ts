import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { PublierCommentaireUseCase } from "@/server/commentaires/usecases/PublierCommentaireUseCase";
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
  chantierId: "chantier-1",
  territoireCode: "REG-01",
  type: "risquesEtFreinsÀLever" as const,
  contenu: "contenu publié",
  auteurId: "auteur-1",
  date: "2026-01-01",
  habilitations: habilitationsAvecAcces,
};

describe("PublierCommentaireUseCase", () => {
  let useCase: PublierCommentaireUseCase;
  let commentaireRepository: MockProxy<CommentaireRepository>;

  beforeEach(() => {
    commentaireRepository = mock<CommentaireRepository>();
    useCase = new PublierCommentaireUseCase({ commentaireRepository });
  });

  it("enregistre un nouveau commentaire avec statut PUBLIE", async () => {
    // when
    await useCase.execute(input);

    // then
    expect(commentaireRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });
});
