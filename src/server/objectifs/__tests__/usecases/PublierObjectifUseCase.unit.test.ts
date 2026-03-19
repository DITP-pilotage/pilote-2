import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import { PublierObjectifUseCase } from "@/server/objectifs/usecases/PublierObjectifUseCase";
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
  contenu: "contenu publié",
  auteurId: "auteur-1",
  date: "2026-01-01",
  habilitations: habilitationsAvecAcces,
};

describe("PublierObjectifUseCase", () => {
  let useCase: PublierObjectifUseCase;
  let objectifRepository: MockProxy<ObjectifRepository>;

  beforeEach(() => {
    objectifRepository = mock<ObjectifRepository>();
    useCase = new PublierObjectifUseCase({ objectifRepository });
  });

  it("enregistre un nouvel objectif avec statut PUBLIE", async () => {
    // when
    await useCase.execute(input);

    // then
    expect(objectifRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        statut: $Enums.statut_publication.PUBLIE,
      }),
    );
  });
});
