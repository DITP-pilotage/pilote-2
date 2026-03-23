import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import { EnregistrerBrouillonObjectifUseCase } from "@/server/objectifs/usecases/EnregistrerBrouillonObjectifUseCase";
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
  type: "notreAmbition" as const,
  contenu: "contenu du brouillon",
  auteurId: "auteur-1",
  date: "2026-01-01",
  habilitations: habilitationsAvecAcces,
};

describe("EnregistrerBrouillonObjectifUseCase", () => {
  let useCase: EnregistrerBrouillonObjectifUseCase;
  let objectifRepository: MockProxy<ObjectifRepository>;

  beforeEach(() => {
    objectifRepository = mock<ObjectifRepository>();
    useCase = new EnregistrerBrouillonObjectifUseCase({ objectifRepository });
  });

  it("enregistre un nouvel objectif avec statut BROUILLON", async () => {
    // when
    await useCase.execute(input);

    // then
    expect(objectifRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        statut: $Enums.statut_publication.BROUILLON,
      }),
    );
  });
});
