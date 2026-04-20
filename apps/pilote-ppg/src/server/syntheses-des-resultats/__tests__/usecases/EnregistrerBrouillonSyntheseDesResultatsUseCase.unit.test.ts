import { MockProxy, mock } from "vitest-mock-extended";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { EnregistrerBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/EnregistrerBrouillonSyntheseDesResultatsUseCase";
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
  territoireCode: "NAT-FR",
  contenu: "contenu initial",
  meteo: "COUVERT" as const,
  auteurId: "auteur-1",
  date: "2026-01-01",
  habilitations: habilitationsAvecAcces,
};

describe("EnregistrerBrouillonSyntheseDesResultatsUseCase", () => {
  let useCase: EnregistrerBrouillonSyntheseDesResultatsUseCase;
  let enregistrerSyntheseDesResultatsService: MockProxy<EnregistrerSyntheseDesResultatsService>;

  beforeEach(() => {
    enregistrerSyntheseDesResultatsService =
      mock<EnregistrerSyntheseDesResultatsService>();
    useCase = new EnregistrerBrouillonSyntheseDesResultatsUseCase({
      enregistrerSyntheseDesResultatsService,
    });
  });

  it("crée une nouvelle synthèse en BROUILLON et la sauvegarde", async () => {
    // when
    await useCase.execute(input);

    // then
    expect(
      enregistrerSyntheseDesResultatsService.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        chantierId: "chantier-1",
        territoireCode: "NAT-FR",
        statut: "BROUILLON",
      }),
    );
  });
});
