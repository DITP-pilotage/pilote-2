import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

const filtresVides = {
  territoires: [],
  perimetresMinisteriels: [],
  chantiers: [],
  chantiersAssociésAuxPérimètres: [],
  profils: [],
  typeCompte: ["actif", "desactive"] as ("actif" | "desactive")[],
};

const autorisationsSansBorne = {
  profilsAutorisés: null,
  territoiresAutorisés: null,
  chantiersAutorisés: null,
};

describe("PrismaUtilisateurRepository - recupererFiltresEtPagines", () => {
  const prisma = new PrismaPilote();
  let repository: PrismaUtilisateurRepository;

  beforeEach(() => {
    repository = new PrismaUtilisateurRepository({ prisma });
  });

  describe("pagination", () => {
    it(
      "retourne le totalCount et les ids de la page demandée",
      createIntegrationTest(async () => {
        // Given
        const utilisateur1 = await fixtures.utilisateur({
          nom: "Abert",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const utilisateur2 = await fixtures.utilisateur({
          nom: "Bernard",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        await fixtures.utilisateur({
          nom: "Charles",
          profilCode: ProfilEnum.DITP_ADMIN,
        });

        // When
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: filtresVides,
          autorisations: autorisationsSansBorne,
          pagination: { pageIndex: 1, pageSize: 2 },
        });

        // Then
        expect(result.totalCount).toBe(3);
        expect(result.utilisateurIds).toEqual([
          utilisateur1.id,
          utilisateur2.id,
        ]);
      }),
    );

    it(
      "retourne la deuxième page correctement",
      createIntegrationTest(async () => {
        // Given
        await fixtures.utilisateur({
          nom: "Abert",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        await fixtures.utilisateur({
          nom: "Bernard",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const utilisateur3 = await fixtures.utilisateur({
          nom: "Charles",
          profilCode: ProfilEnum.DITP_ADMIN,
        });

        // When
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: filtresVides,
          autorisations: autorisationsSansBorne,
          pagination: { pageIndex: 2, pageSize: 2 },
        });

        // Then
        expect(result.totalCount).toBe(3);
        expect(result.utilisateurIds).toEqual([utilisateur3.id]);
      }),
    );
  });

  describe("autorisations", () => {
    it(
      "filtre les utilisateurs par profils autorisés",
      createIntegrationTest(async () => {
        // Given
        const prefet = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_REGION,
        });
        await fixtures.habilitation({
          utilisateurId: prefet.id,
          territoires: ["REG-84"],
        });

        const admin = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        await fixtures.habilitation({
          utilisateurId: admin.id,
        });

        // When - seuls les PREFET_REGION sont autorisés
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: filtresVides,
          autorisations: {
            profilsAutorisés: [ProfilEnum.PREFET_REGION],
            territoiresAutorisés: null,
            chantiersAutorisés: null,
          },
          pagination: { pageIndex: 1, pageSize: 10 },
        });

        // Then
        expect(result.utilisateurIds).toEqual([prefet.id]);
        expect(result.totalCount).toBe(1);
      }),
    );

    it(
      "filtre les utilisateurs par territoires autorisés",
      createIntegrationTest(async () => {
        // Given
        const prefetHerault = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
        });
        await fixtures.habilitation({
          utilisateurId: prefetHerault.id,
          territoires: ["DEPT-34"],
        });

        const prefetParis = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
        });
        await fixtures.habilitation({
          utilisateurId: prefetParis.id,
          territoires: ["DEPT-75"],
        });

        // When - seul DEPT-34 est autorisé
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: filtresVides,
          autorisations: {
            profilsAutorisés: [
              ProfilEnum.PREFET_DEPARTEMENT,
              ProfilEnum.PREFET_REGION,
            ],
            territoiresAutorisés: ["DEPT-34"],
            chantiersAutorisés: null,
          },
          pagination: { pageIndex: 1, pageSize: 10 },
        });

        // Then
        expect(result.utilisateurIds).toEqual([prefetHerault.id]);
        expect(result.totalCount).toBe(1);
      }),
    );
  });

  describe("filtres", () => {
    it(
      "filtre par type de compte actif uniquement",
      createIntegrationTest(async () => {
        // Given
        const actif = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
          date_desactivation: new Date(),
        });

        // When
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: { ...filtresVides, typeCompte: ["actif"] },
          autorisations: autorisationsSansBorne,
          pagination: { pageIndex: 1, pageSize: 10 },
        });

        // Then
        expect(result.utilisateurIds).toEqual([actif.id]);
        expect(result.totalCount).toBe(1);
      }),
    );

    it(
      "filtre par profil",
      createIntegrationTest(async () => {
        // Given
        const prefet = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_REGION,
        });
        await fixtures.habilitation({
          utilisateurId: prefet.id,
          territoires: ["REG-84"],
        });

        await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
        });

        // When
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: {
            ...filtresVides,
            profils: [ProfilEnum.PREFET_REGION],
          },
          autorisations: autorisationsSansBorne,
          pagination: { pageIndex: 1, pageSize: 10 },
        });

        // Then
        expect(result.utilisateurIds).toEqual([prefet.id]);
        expect(result.totalCount).toBe(1);
      }),
    );

    it(
      "filtre par périmètre et chantiers associés aux périmètres",
      createIntegrationTest(async () => {
        // Given
        // Profil sans a_acces_tous_chantiers pour que le filtre périmètre s'applique
        const utilisateurPerimetre = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
        });
        await fixtures.habilitation({
          utilisateurId: utilisateurPerimetre.id,
          perimetres: ["PER-001"],
          territoires: ["DEPT-34"],
        });

        const utilisateurChantierAssocie = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
        });
        await fixtures.habilitation({
          utilisateurId: utilisateurChantierAssocie.id,
          chantiers: ["CH-002"],
          territoires: ["DEPT-34"],
        });

        const utilisateurSansLien = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
        });
        await fixtures.habilitation({
          utilisateurId: utilisateurSansLien.id,
          chantiers: ["CH-999"],
          territoires: ["DEPT-34"],
        });

        // When
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "",
          filtres: {
            ...filtresVides,
            perimetresMinisteriels: ["PER-001"],
            chantiersAssociésAuxPérimètres: ["CH-002"],
          },
          autorisations: autorisationsSansBorne,
          pagination: { pageIndex: 1, pageSize: 10 },
        });

        // Then
        expect(result.totalCount).toBe(2);
        expect(result.utilisateurIds).toEqual(
          expect.arrayContaining([
            utilisateurPerimetre.id,
            utilisateurChantierAssocie.id,
          ]),
        );
      }),
    );
  });

  describe("recherche textuelle", () => {
    it(
      "filtre par recherche textuelle sur le nom",
      createIntegrationTest(async () => {
        // Given
        const dupont = await fixtures.utilisateur({
          nom: "Dupont",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        await fixtures.utilisateur({
          nom: "Martin",
          profilCode: ProfilEnum.DITP_ADMIN,
        });

        // When
        const result = await repository.recupererFiltresEtPagines({
          sorting: { id: "nom", desc: false },
          valeurDeLaRecherche: "dupont",
          filtres: filtresVides,
          autorisations: autorisationsSansBorne,
          pagination: { pageIndex: 1, pageSize: 10 },
        });

        // Then
        expect(result.utilisateurIds).toEqual([dupont.id]);
        expect(result.totalCount).toBe(1);
      }),
    );
  });
});
