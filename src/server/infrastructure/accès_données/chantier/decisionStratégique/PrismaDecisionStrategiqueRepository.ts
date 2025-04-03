import {
  decision_strategique as DecisionStrategiquePrisma,
  PrismaClient,
  type_decision_strategique as TypeDecisionStrategiquePrisma,
  utilisateur,
} from '@prisma/client';
import { DecisionStrategique, TypeDecisionStrategique } from '@/server/domain/chantier/decisionStrategique/DecisionStrategique.interface';
import { DecisionStrategiqueRepository } from '@/server/domain/chantier/decisionStrategique/DecisionStrategiqueRepository.interface';
import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { PrismaPilote } from '@/server/db/PrismaPilote';

export const NOMS_TYPES_DECISION_STRATEGIQUE: Record<string, TypeDecisionStrategique> = {
  suivi_des_decisions: 'suiviDesDécisionsStratégiques',
};

export const CODES_TYPES_DECISION_STRATEGIQUE: Record<TypeDecisionStrategique, TypeDecisionStrategiquePrisma> = {
  suiviDesDécisionsStratégiques: 'suivi_des_decisions',
};

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaDecisionStrategiqueRepository implements DecisionStrategiqueRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  private mapperVersDomaine(decisionStrategique: DecisionStrategiquePrisma & { auteur_decision_strategique: utilisateur | null }): DecisionStrategique {
    const auteurDecisionStrategique = decisionStrategique.auteur_decision_strategique;
    return {
      id: decisionStrategique.id,
      type: NOMS_TYPES_DECISION_STRATEGIQUE[decisionStrategique.type],
      contenu: decisionStrategique.contenu,
      date: decisionStrategique.date.toISOString(),
      auteur: auteurDecisionStrategique ? `${auteurDecisionStrategique.prenom} ${auteurDecisionStrategique.nom}` : 'Auteur Inconnu',
    };
  }
  
  async récupérerLaPlusRécente(chantierId: string): Promise<DecisionStrategique> {
    const decisionStrategiqueLaPlusRécente = await this.prisma.decision_strategique.findFirst({
      where: {
        chantier_id: chantierId,
      },
      include: {
        auteur_decision_strategique: true,
      },
      orderBy: { date: 'desc' },
    });

    return decisionStrategiqueLaPlusRécente ? this.mapperVersDomaine(decisionStrategiqueLaPlusRécente) : null;
  }

  async récupérerHistorique(chantierId: string): Promise<DecisionStrategique[]> {
    const decisionsStrategiques = await this.prisma.decision_strategique.findMany({
      where: {
        chantier_id: chantierId,
      },
      include: {
        auteur_decision_strategique: true,
      },
      orderBy: { date: 'desc' },
    });

    return decisionsStrategiques.map(decisionStrategique => this.mapperVersDomaine(decisionStrategique));
  }

  async créer(chantierId: string, id: string, contenu: string, type: TypeDecisionStrategique, auteur_id: string, date: Date): Promise<DecisionStrategique> {
    const decisionStrategiqueCreee = await this.prisma.decision_strategique.create({
      data: {
        id,
        chantier_id: chantierId,
        contenu,
        type: CODES_TYPES_DECISION_STRATEGIQUE[type],
        date,
        auteur_id,
      },
      include: {
        auteur_decision_strategique: true,
      },
    });

    return this.mapperVersDomaine(decisionStrategiqueCreee);
  }

  async récupérerLesPlusRécentesGroupéesParChantier(chantiersIds: Chantier['id'][]): Promise<Record<string, DecisionStrategique>> {
    const decisionsStrategiques = await this.prisma.$queryRaw<(DecisionStrategiquePrisma & { prenom_auteur: string | null, nom_auteur: string | null })[]>`
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
      decisionsStrategiques.map(decisionStrategique => (
        [
          decisionStrategique.chantier_id,
          {
            id: decisionStrategique.id,
            type: NOMS_TYPES_DECISION_STRATEGIQUE[decisionStrategique.type],
            contenu: decisionStrategique.contenu,
            date: decisionStrategique.date.toISOString(),
            auteur: decisionStrategique.auteur_id ? `${decisionStrategique.prenom_auteur} ${decisionStrategique.nom_auteur}` : 'Auteur Inconnu',
          },
        ]
      )),
    );
  }
}
