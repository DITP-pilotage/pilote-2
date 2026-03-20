import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import { EnregistrerBrouillonDecisionStrategiqueUseCase } from "@/server/decisions-strategiques/usecases/EnregistrerBrouillonDecisionStrategiqueUseCase";
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
  chantierId: "chantier-1",
  type: "suiviDesDecisionsStrategiques" as const,
  contenu: "contenu du brouillon",
  auteurId: "auteur-1",
  date: "2026-01-01",
  habilitations: habilitationsAvecAcces,
};

describe("EnregistrerBrouillonDecisionStrategiqueUseCase", () => {
  let useCase: EnregistrerBrouillonDecisionStrategiqueUseCase;
  let décisionStratégiqueRepository: MockProxy<DécisionStratégiqueRepository>;

  beforeEach(() => {
    décisionStratégiqueRepository = mock<DécisionStratégiqueRepository>();
    useCase = new EnregistrerBrouillonDecisionStrategiqueUseCase({
      décisionStratégiqueRepository,
    });
  });

  it("enregistre une nouvelle décision avec statut BROUILLON", async () => {
    // when
    await useCase.execute(input);

    // then
    expect(décisionStratégiqueRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        statut: $Enums.statut_publication.BROUILLON,
      }),
    );
  });
});
