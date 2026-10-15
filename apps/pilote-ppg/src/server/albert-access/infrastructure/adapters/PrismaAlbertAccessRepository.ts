import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import {
  AlbertAccessRepository,
  ProfilAccess,
  UtilisateurAccess,
  UtilisateurSearchResult,
} from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const UTILISATEUR_SELECT = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  profilCode: true,
  profil: {
    select: {
      nom: true,
      albert_access_profil: { select: { profil_code: true } },
    },
  },
} as const;

type UtilisateurRow = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  profil: {
    nom: string;
    albert_access_profil: { profil_code: string } | null;
  };
};

const toUtilisateurAccess = (
  utilisateur: UtilisateurRow,
): UtilisateurAccess => ({
  utilisateurId: utilisateur.id,
  email: utilisateur.email,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  profilCode: utilisateur.profilCode,
  profilNom: utilisateur.profil.nom,
  autoriseViaProfil: utilisateur.profil.albert_access_profil !== null,
});

export class PrismaAlbertAccessRepository implements AlbertAccessRepository {
  private prisma: PilotePrismaClient;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async listProfils(): Promise<ProfilAccess[]> {
    const profils = await this.prisma.profil.findMany({
      where: { code: { not: ProfilEnum.DITP_ADMIN } },
      select: {
        code: true,
        nom: true,
        albert_access_profil: { select: { profil_code: true } },
      },
      orderBy: { nom: "asc" },
    });
    return profils.map((profil) => ({
      code: profil.code,
      nom: profil.nom,
      active: profil.albert_access_profil !== null,
    }));
  }

  async setProfilActive(profilCode: string, active: boolean): Promise<void> {
    if (active) {
      await this.prisma.albert_access_profil.upsert({
        where: { profil_code: profilCode },
        create: { profil_code: profilCode },
        update: {},
      });
      return;
    }
    await this.prisma.albert_access_profil.deleteMany({
      where: { profil_code: profilCode },
    });
  }

  async listUtilisateurs(): Promise<UtilisateurAccess[]> {
    const acces = await this.prisma.albert_access_utilisateur.findMany({
      orderBy: { date_creation: "desc" },
      select: { utilisateur: { select: UTILISATEUR_SELECT } },
    });
    return acces.map(({ utilisateur }) => toUtilisateurAccess(utilisateur));
  }

  async searchUtilisateurs(
    email: string,
    limit: number,
  ): Promise<UtilisateurSearchResult[]> {
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: {
        email: { contains: email, mode: "insensitive" },
        profilCode: { not: ProfilEnum.DITP_ADMIN },
        date_desactivation: null,
      },
      orderBy: { email: "asc" },
      take: limit,
      select: {
        ...UTILISATEUR_SELECT,
        albert_access_utilisateur: { select: { utilisateur_id: true } },
      },
    });
    return utilisateurs.map((utilisateur) => ({
      ...toUtilisateurAccess(utilisateur),
      dejaAjoute: utilisateur.albert_access_utilisateur !== null,
    }));
  }

  async findUtilisateurProfil(utilisateurId: string): Promise<string | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { profilCode: true },
    });
    return utilisateur?.profilCode ?? null;
  }

  async addUtilisateur(utilisateurId: string): Promise<void> {
    await this.prisma.albert_access_utilisateur.upsert({
      where: { utilisateur_id: utilisateurId },
      create: { utilisateur_id: utilisateurId },
      update: {},
    });
  }

  async removeUtilisateur(utilisateurId: string): Promise<void> {
    await this.prisma.albert_access_utilisateur.deleteMany({
      where: { utilisateur_id: utilisateurId },
    });
  }

  async getAccessFlags(
    utilisateurId: string,
    profil: string | null,
  ): Promise<{ profilActive: boolean; utilisateurAutorise: boolean }> {
    const accesProfil =
      profil === null
        ? null
        : await this.prisma.albert_access_profil.findUnique({
            where: { profil_code: profil },
          });
    const accesUtilisateur =
      await this.prisma.albert_access_utilisateur.findUnique({
        where: { utilisateur_id: utilisateurId },
      });
    return {
      profilActive: accesProfil !== null,
      utilisateurAutorise: accesUtilisateur !== null,
    };
  }
}
