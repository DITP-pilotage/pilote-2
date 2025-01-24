import { decision_strategique as DécisionStratégiquePrisma, type_decision_strategique as TypeDécisionStratégiquePrisma, utilisateur } from '@prisma/client';
import DécisionStratégique, { TypeDécisionStratégique } from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import DécisionStratégiqueRepository from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { prisma } from '@/server/db/prisma';

export const NOMS_TYPES_DÉCISION_STRATÉGIQUE: Record<string, TypeDécisionStratégique> = {
  suivi_des_decisions: 'suiviDesDécisionsStratégiques',
};

export const CODES_TYPES_DÉCISION_STRATÉGIQUE: Record<TypeDécisionStratégique, TypeDécisionStratégiquePrisma> = {
  suiviDesDécisionsStratégiques: 'suivi_des_decisions',
};

export default class DécisionStratégiqueSQLRepository implements DécisionStratégiqueRepository {
  private mapperVersDomaine(décisionStratégique: DécisionStratégiquePrisma & { auteur_decision_strategique: utilisateur | null }): DécisionStratégique {
    const auteurDecisionStrategique = décisionStratégique.auteur_decision_strategique;
    return {
      id: décisionStratégique.id,
      type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[décisionStratégique.type],
      contenu: décisionStratégique.contenu,
      date: décisionStratégique.date.toISOString(),
      auteur: auteurDecisionStrategique ? `${auteurDecisionStrategique.prenom} ${auteurDecisionStrategique.nom}` : 'Auteur Inconnu',
    };
  }
  
  async récupérerLaPlusRécente(chantierId: string): Promise<DécisionStratégique> {
    const décisionStratégiqueLaPlusRécente = await prisma.decision_strategique.findFirst({
      where: {
        chantier_id: chantierId,
      },
      include: {
        auteur_decision_strategique: true,
      },
      orderBy: { date: 'desc' },
    });

    return décisionStratégiqueLaPlusRécente ? this.mapperVersDomaine(décisionStratégiqueLaPlusRécente) : null;
  }

  async récupérerHistorique(chantierId: string): Promise<DécisionStratégique[]> {
    const décisionsStratégiques = await prisma.decision_strategique.findMany({
      where: {
        chantier_id: chantierId,
      },
      include: {
        auteur_decision_strategique: true,
      },
      orderBy: { date: 'desc' },
    });

    return décisionsStratégiques.map(décisionStratégique => this.mapperVersDomaine(décisionStratégique));
  }

  async créer(chantierId: string, id: string, contenu: string, type: TypeDécisionStratégique, auteur_id: string, date: Date): Promise<DécisionStratégique> {
    const décisionStratégiqueCréée = await prisma.decision_strategique.create({
      data: {
        id,
        chantier_id: chantierId,
        contenu,
        type: CODES_TYPES_DÉCISION_STRATÉGIQUE[type],
        date,
        auteur_id,
      },
      include: {
        auteur_decision_strategique: true,
      },
    });

    return this.mapperVersDomaine(décisionStratégiqueCréée);
  }

  async récupérerLesPlusRécentesGroupéesParChantier(chantiersIds: Chantier['id'][]): Promise<Record<string, DécisionStratégique>> {
    const décisionsStratégiques = await prisma.$queryRaw<(DécisionStratégiquePrisma & { prenom_auteur: string | null, nom_auteur: string | null })[]>`
        SELECT d.*, utilisateur.prenom as prenom_auteur, utilisateur.nom as nom_auteur
        FROM decision_strategique d
          LEFT JOIN utilisateur on utilisateur.id = d.auteur_id
          INNER JOIN (
            SELECT chantier_id, MAX(date) as maxdate
            FROM decision_strategique
            WHERE chantier_id = ANY (${chantiersIds})
            GROUP BY chantier_id
          ) d_recents
          ON d.date = d_recents.maxdate
          AND d.chantier_id = d_recents.chantier_id
    `;

    return Object.fromEntries(
      décisionsStratégiques.map(décisionStratégique => (
        [
          décisionStratégique.chantier_id,
          {
            id: décisionStratégique.id,
            type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[décisionStratégique.type],
            contenu: décisionStratégique.contenu,
            date: décisionStratégique.date.toISOString(),
            auteur: décisionStratégique.auteur_id ? `${décisionStratégique.prenom_auteur} ${décisionStratégique.nom_auteur}` : 'Auteur Inconnu',
          },
        ]
      )),
    );
  }
}
