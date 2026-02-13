import { mock, MockProxy } from "vitest-mock-extended";
import { RecupererUtilisateursPaginesUseCase } from "@/server/gestion-utilisateur/usecases/RecupererUtilisateursPaginesUseCase";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UtilisateurListeGestion } from "@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface";

const filtresParDefaut = {
  territoires: [],
  perimetresMinisteriels: [],
  chantiers: [],
  chantiersAssociésAuxPérimètres: [],
  profils: [],
  typeCompte: ["actif", "desactive"] as ("actif" | "desactive")[],
};

const paginationParDefaut = { pageIndex: 1, pageSize: 10 };

const habilitationParDefaut = {
  territoires: [],
  chantiers: [],
  périmètres: [],
  __meta: {
    aAccesTousLesChantiers: false,
    aAccesTousLesTerritoires: false,
    aAccesTousLesPerimetres: false,
  },
};

const creerUtilisateurListeGestion = (
  overrides: Partial<UtilisateurListeGestion> = {},
): UtilisateurListeGestion => ({
  id: "uuid-1",
  email: "test@test.com",
  nom: "Dupont",
  prénom: "Jean",
  fonction: null,
  habilitations: {
    lecture: habilitationParDefaut,
    saisieCommentaire: habilitationParDefaut,
    saisieIndicateur: habilitationParDefaut,
    gestionUtilisateur: habilitationParDefaut,
    responsabilite: habilitationParDefaut,
  },
  dateModification: "2024-01-01",
  auteurModification: "admin",
  profil: ProfilEnum.DITP_ADMIN,
  dateDesactivation: null,
  ...overrides,
});

describe("RecupererUtilisateursPaginesUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let chantierRepository: MockProxy<ChantierRepository>;
  let perimetreMinisterielRepository: MockProxy<PerimetreMinisterielRepository>;
  let useCase: RecupererUtilisateursPaginesUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    territoireRepository = mock<TerritoireRepository>();
    chantierRepository = mock<ChantierRepository>();
    perimetreMinisterielRepository = mock<PerimetreMinisterielRepository>();

    useCase = new RecupererUtilisateursPaginesUseCase({
      utilisateurRepository,
      territoireRepository,
      chantierRepository,
      perimetreMinisterielRepository,
    });

    territoireRepository.listerCodes.mockResolvedValue([]);
    perimetreMinisterielRepository.listerIds.mockResolvedValue([]);
    chantierRepository.listerInformationsChantiersUtilisateurs.mockResolvedValue(
      [],
    );
    utilisateurRepository.recupererFiltresEtPagines.mockResolvedValue({
      utilisateurIds: [],
      totalCount: 0,
    });
    utilisateurRepository.recupererParIds.mockResolvedValue([]);
  });

  describe("autorisations selon le profil du viewer", () => {
    it("bypass toutes les autorisations quand le viewer est DITP_ADMIN", async () => {
      // When
      await useCase.run({
        sorting: [{ id: "nom", desc: false }],
        valeurDeLaRecherche: "",
        filtres: filtresParDefaut,
        pagination: paginationParDefaut,
        viewerProfil: ProfilEnum.DITP_ADMIN,
        viewerHabilitations: {
          gestionUtilisateur: {
            territoires: ["DEPT-34"],
            chantiers: ["CH-001"],
          },
        },
      });

      // Then
      expect(
        utilisateurRepository.recupererFiltresEtPagines,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          autorisations: {
            profilsAutorisés: null,
            territoiresAutorisés: null,
            chantiersAutorisés: null,
          },
        }),
      );
    });

    it("restreint les autorisations quand le viewer est COORDINATEUR_REGION", async () => {
      // When
      await useCase.run({
        sorting: [{ id: "nom", desc: false }],
        valeurDeLaRecherche: "",
        filtres: filtresParDefaut,
        pagination: paginationParDefaut,
        viewerProfil: ProfilEnum.COORDINATEUR_REGION,
        viewerHabilitations: {
          gestionUtilisateur: {
            territoires: ["REG-84"],
            chantiers: ["CH-001"],
          },
        },
      });

      // Then
      expect(
        utilisateurRepository.recupererFiltresEtPagines,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          autorisations: {
            profilsAutorisés: expect.arrayContaining([
              ProfilEnum.PREFET_REGION,
              ProfilEnum.PREFET_DEPARTEMENT,
            ]),
            territoiresAutorisés: ["REG-84"],
            chantiersAutorisés: ["CH-001"],
          },
        }),
      );
    });
  });

  describe("propagation du sorting", () => {
    it("passe sorting[0] au repository", async () => {
      // When
      await useCase.run({
        sorting: [{ id: "email", desc: true }],
        valeurDeLaRecherche: "",
        filtres: filtresParDefaut,
        pagination: paginationParDefaut,
        viewerProfil: ProfilEnum.DITP_ADMIN,
        viewerHabilitations: {
          gestionUtilisateur: { territoires: [], chantiers: [] },
        },
      });

      // Then
      expect(
        utilisateurRepository.recupererFiltresEtPagines,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          sorting: { id: "email", desc: true },
        }),
      );
    });

    it("utilise le tri par défaut quand le tableau de sorting est vide", async () => {
      // When
      await useCase.run({
        sorting: [],
        valeurDeLaRecherche: "",
        filtres: filtresParDefaut,
        pagination: paginationParDefaut,
        viewerProfil: ProfilEnum.DITP_ADMIN,
        viewerHabilitations: {
          gestionUtilisateur: { territoires: [], chantiers: [] },
        },
      });

      // Then
      expect(
        utilisateurRepository.recupererFiltresEtPagines,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          sorting: { id: "Dernière modification", desc: true },
        }),
      );
    });
  });

  describe("récupération des utilisateurs", () => {
    it("retourne une liste vide et totalCount 0 quand aucun utilisateur ne correspond", async () => {
      // When
      const result = await useCase.run({
        sorting: [{ id: "nom", desc: false }],
        valeurDeLaRecherche: "",
        filtres: filtresParDefaut,
        pagination: paginationParDefaut,
        viewerProfil: ProfilEnum.DITP_ADMIN,
        viewerHabilitations: {
          gestionUtilisateur: { territoires: [], chantiers: [] },
        },
      });

      // Then
      expect(result).toEqual({ utilisateurs: [], totalCount: 0 });
    });

    it("transmet les ids paginés au repository et retourne les utilisateurs", async () => {
      // Given
      const utilisateur = creerUtilisateurListeGestion();
      utilisateurRepository.recupererFiltresEtPagines.mockResolvedValue({
        utilisateurIds: ["uuid-1"],
        totalCount: 1,
      });
      utilisateurRepository.recupererParIds.mockResolvedValue([utilisateur]);

      // When
      const result = await useCase.run({
        sorting: [{ id: "nom", desc: false }],
        valeurDeLaRecherche: "",
        filtres: filtresParDefaut,
        pagination: paginationParDefaut,
        viewerProfil: ProfilEnum.DITP_ADMIN,
        viewerHabilitations: {
          gestionUtilisateur: { territoires: [], chantiers: [] },
        },
      });

      // Then
      expect(result).toEqual({ utilisateurs: [utilisateur], totalCount: 1 });
      expect(utilisateurRepository.recupererParIds).toHaveBeenCalledWith(
        expect.objectContaining({ ids: ["uuid-1"] }),
      );
    });
  });
});
