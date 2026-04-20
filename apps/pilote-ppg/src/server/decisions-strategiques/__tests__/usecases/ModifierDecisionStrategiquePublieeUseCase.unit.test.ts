import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import { DecisionStrategiqueV2 } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { ModifierDecisionStrategiquePublieeUseCase } from "@/server/decisions-strategiques/usecases/ModifierDecisionStrategiquePublieeUseCase";
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
  decisionStrategiqueId: "decision-1",
  contenu: "nouveau contenu",
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
  habilitations: habilitationsAvecAcces,
};

function decisionAvecStatut(
  statut: $Enums.statut_publication,
): DecisionStrategiqueV2 {
  return {
    id: "decision-1",
    chantierId: "chantier-1",
    contenu: "contenu initial",
    statut,
    auteurCreationId: "auteur-1",
    auteurModificationId: "auteur-1",
    dateCreation: "2026-01-01",
    dateModification: "2026-01-01",
  };
}

describe("ModifierDecisionStrategiquePublieeUseCase", () => {
  let useCase: ModifierDecisionStrategiquePublieeUseCase;
  let décisionStratégiqueRepository: MockProxy<DécisionStratégiqueRepository>;

  beforeEach(() => {
    décisionStratégiqueRepository = mock<DécisionStratégiqueRepository>();
    useCase = new ModifierDecisionStrategiquePublieeUseCase({
      décisionStratégiqueRepository,
    });
  });

  it("modifie une décision PUBLIE et la sauvegarde en PUBLIE", async () => {
    // given
    décisionStratégiqueRepository.getById.mockResolvedValue(
      decisionAvecStatut($Enums.statut_publication.PUBLIE),
    );

    // when
    await useCase.execute(input);

    // then
    expect(décisionStratégiqueRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "decision-1",
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });

  it("rejette un ID introuvable sans appeler save", async () => {
    // given
    décisionStratégiqueRepository.getById.mockResolvedValue(null);

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Décision stratégique introuvable",
    );
    expect(décisionStratégiqueRepository.save).not.toHaveBeenCalled();
  });

  it("rejette un brouillon passé par erreur sans appeler save", async () => {
    // given - un brouillon passé par erreur comme ID de décision publiée
    décisionStratégiqueRepository.getById.mockResolvedValue(
      decisionAvecStatut($Enums.statut_publication.BROUILLON),
    );

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Statut invalide : attendu PUBLIE, reçu BROUILLON",
    );
    expect(décisionStratégiqueRepository.save).not.toHaveBeenCalled();
  });
});
