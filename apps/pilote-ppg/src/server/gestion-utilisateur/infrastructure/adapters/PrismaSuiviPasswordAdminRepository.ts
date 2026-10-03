import { suivi_password_admin } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

function convertirEnSuivi(row: suivi_password_admin): SuiviPasswordAdmin {
  return {
    utilisateurId: row.utilisateur_id,
    dateDernierChangement: row.date_dernier_changement,
    dateExpiration: row.date_expiration,
    datePremiereRelance: row.date_premiere_relance,
    dateDeuxiemeRelance: row.date_deuxieme_relance,
    dateExpirationForcee: row.date_expiration_forcee,
  };
}

export class PrismaSuiviPasswordAdminRepository implements SuiviPasswordAdminRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async recupererParUtilisateur(
    utilisateurId: string,
  ): Promise<SuiviPasswordAdmin | null> {
    const row = await this.dependencies.prisma
      .getInstance()
      .suivi_password_admin.findUnique({
        where: { utilisateur_id: utilisateurId },
      });

    return row ? convertirEnSuivi(row) : null;
  }

  async sauvegarder(suivi: SuiviPasswordAdmin): Promise<void> {
    const donnees = {
      date_dernier_changement: suivi.dateDernierChangement,
      date_expiration: suivi.dateExpiration,
      date_premiere_relance: suivi.datePremiereRelance,
      date_deuxieme_relance: suivi.dateDeuxiemeRelance,
      date_expiration_forcee: suivi.dateExpirationForcee,
    };

    await this.dependencies.prisma.getInstance().suivi_password_admin.upsert({
      where: { utilisateur_id: suivi.utilisateurId },
      create: { utilisateur_id: suivi.utilisateurId, ...donnees },
      update: donnees,
    });
  }

  async recupererDesComptesActifsParProfil(
    profilCode: ProfilCode,
  ): Promise<SuiviPasswordAdmin[]> {
    const rows = await this.dependencies.prisma
      .getInstance()
      .suivi_password_admin.findMany({
        where: { utilisateur: { profilCode, date_desactivation: null } },
      });

    return rows.map(convertirEnSuivi);
  }
}
