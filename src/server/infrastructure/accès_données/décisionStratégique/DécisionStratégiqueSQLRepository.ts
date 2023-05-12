import { PrismaClient, decision_strategique as DécisionStratégiquePrisma, type_decision_strategique as TypeDécisionStratégiquePrisma } from '@prisma/client';
import DécisionStratégique, { TypeDécisionStratégique } from '@/server/domain/décisionStratégique/DécisionStratégique.interface';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export const NOMS_TYPES_DÉCISION_STRATÉGIQUE: Record<string, TypeDécisionStratégique> = {
  suivi_des_decision: 'suiviDesDécisionsStratégiques',
};

export const CODES_TYPES_DÉCISION_STRATÉGIQUE: Record<TypeDécisionStratégique, TypeDécisionStratégiquePrisma> = {
  suiviDesDécisionsStratégiques: 'suivi_des_decisions',
};

export default class DécisionStratégiqueSQLRepository implements DécisionStratégiqueRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  private mapperVersDomaine(décisionStratégique: DécisionStratégiquePrisma): DécisionStratégique {
    return {
      id: décisionStratégique.id,
      type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[décisionStratégique.type],
      contenu: décisionStratégique.contenu,
      date: décisionStratégique.date.toISOString(),
      auteur: décisionStratégique.auteur,
    };
  }
  
  async récupérerLaPlusRécente(chantierId: string): Promise<DécisionStratégique> {
    const décisionStratégiqueLaPlusRécente = await this.prisma.decision_strategique.findFirst({
      where: {
        chantier_id: chantierId,
      },
      orderBy: { date: 'desc' },
    });
  
    return décisionStratégiqueLaPlusRécente ? this.mapperVersDomaine(décisionStratégiqueLaPlusRécente) : null;
  }

  async récupérerHistorique(chantierId: string): Promise<DécisionStratégique[]> {
    const décisionsStratégiques: DécisionStratégiquePrisma[] = await this.prisma.decision_strategique.findMany({
      where: {
        chantier_id: chantierId,
      },
      orderBy: { date: 'desc' },
    });

    return décisionsStratégiques.map(décisionStratégique => this.mapperVersDomaine(décisionStratégique));
  }

  async créer(chantierId: string, id: string, contenu: string, type: TypeDécisionStratégique, auteur: string, date: Date): Promise<DécisionStratégique> {
    const décisionStratégiqueCréée = await this.prisma.decision_strategique.create({
      data: {
        id,
        chantier_id: chantierId,
        contenu,
        type: CODES_TYPES_DÉCISION_STRATÉGIQUE[type],
        date,
        auteur,
      } });

    return this.mapperVersDomaine(décisionStratégiqueCréée);
  }

  async récupérerLesPlusRécentesGroupéesParChantier(chantiersIds: Chantier['id'][]) {
    const décisionsStratégiques = await this.prisma.$queryRaw<DécisionStratégiquePrisma[]>`
        SELECT d.*
        FROM decision_strategique d
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
          this.mapperVersDomaine(décisionStratégique),
        ]
      )),
    );
  }
}
