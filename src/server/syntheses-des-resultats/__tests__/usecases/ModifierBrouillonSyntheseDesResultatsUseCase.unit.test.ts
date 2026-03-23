import { MockProxy, mock } from "vitest-mock-extended";
import { $Enums } from "@prisma/client";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { SyntheseDesResultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { ModifierBrouillonSyntheseDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ModifierBrouillonSyntheseDesResultatsUseCase";
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
  brouillonId: "synthese-1",
  contenu: "nouveau contenu",
  meteo: "COUVERT" as const,
  auteurModificationId: "auteur-1",
  dateModification: "2026-01-01",
  habilitations: habilitationsAvecAcces,
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

describe("ModifierBrouillonSyntheseDesResultatsUseCase", () => {
  let useCase: ModifierBrouillonSyntheseDesResultatsUseCase;
  let enregistrerSyntheseDesResultatsService: MockProxy<EnregistrerSyntheseDesResultatsService>;
  let synthèseDesRésultatsRepository: MockProxy<SynthèseDesRésultatsRepository>;

  beforeEach(() => {
    enregistrerSyntheseDesResultatsService =
      mock<EnregistrerSyntheseDesResultatsService>();
    synthèseDesRésultatsRepository = mock<SynthèseDesRésultatsRepository>();
    useCase = new ModifierBrouillonSyntheseDesResultatsUseCase({
      enregistrerSyntheseDesResultatsService,
      synthèseDesRésultatsRepository,
    });
  });

  it("modifie un brouillon et le sauvegarde en BROUILLON", async () => {
    // given
    synthèseDesRésultatsRepository.getById.mockResolvedValue(
      syntheseAvecStatut($Enums.statut_publication.BROUILLON),
    );

    // when
    await useCase.execute(input);

    // then
    expect(
      enregistrerSyntheseDesResultatsService.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "synthese-1",
        statut: $Enums.statut_publication.BROUILLON,
      }),
    );
  });

  it("rejette un ID introuvable sans appeler enregistrer", async () => {
    // given
    synthèseDesRésultatsRepository.getById.mockResolvedValue(null);

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Brouillon introuvable",
    );
    expect(
      enregistrerSyntheseDesResultatsService.enregistrer,
    ).not.toHaveBeenCalled();
  });

  it("rejette une synthèse PUBLIE passée par erreur sans appeler enregistrer", async () => {
    // given - une synthèse publiée passée par erreur comme brouillonId
    synthèseDesRésultatsRepository.getById.mockResolvedValue(
      syntheseAvecStatut($Enums.statut_publication.PUBLIE),
    );

    // then
    await expect(useCase.execute(input)).rejects.toThrow(
      "Statut invalide : attendu BROUILLON, reçu PUBLIE",
    );
    expect(
      enregistrerSyntheseDesResultatsService.enregistrer,
    ).not.toHaveBeenCalled();
  });
});
