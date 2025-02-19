import { chantier_territoire as PrismaChantierTerritoireModel, Maille } from '@prisma/client';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';
import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';
import { prisma } from '@/server/db/prisma';

export class PrismaChantierRepository implements ChantierRepository {
  async listerParTerritoireCodePourUnDepartement({ territoireCode, jalon }: { territoireCode: string, jalon: number }): Promise<Chantier[]> {
    return this.listerParTerritoireCodePourEtMaille({ territoireCode, maille: 'DEPT', jalon });
  }

  async listerParTerritoireCodePourUneRegion({ territoireCode, jalon }: { territoireCode: string, jalon: number }): Promise<Chantier[]> {
    return this.listerParTerritoireCodePourEtMaille({ territoireCode, maille: 'REG', jalon });
  }

  async listerParTerritoireCodePourEtMaille({ territoireCode, maille, jalon }: { territoireCode: string, maille: string, jalon: number }): Promise<Chantier[]> {
    const listePrismaChantierTerritoireModel = await prisma.chantier_territoire.findMany({
      where: {
        territoire_code: territoireCode,
        maille: maille as Maille,
        chantier_identite: {
          est_barometre: true,
          est_territorialise: true,
        },
      },
      include: {
        chantier_identite: {
          select: {
            nom: true,
            ministeres: true,
          },
        },
        chantier_territoire_jalon: {
          where: {
            jalon,
          },
          select: {
            taux_avancement: true,
          },
        },
      },
    });

    return listePrismaChantierTerritoireModel.map(this.convertirEnChantier);
  }

  private convertirEnChantier(prismaChantierTerritoireModel: PrismaChantierTerritoireModel & { chantier_identite: { nom: string, ministeres: string[] }, chantier_territoire_jalon: { taux_avancement: number | null }[] }): Chantier {
    return Chantier.creerChantier({
      id: prismaChantierTerritoireModel.id,
      tauxAvancement: prismaChantierTerritoireModel.chantier_territoire_jalon.at(0)?.taux_avancement || null,
      tauxAvancementAnnuel: prismaChantierTerritoireModel.taux_avancement_mandat,
      meteo: prismaChantierTerritoireModel.meteo as MeteoDisponible | null,
      nom: prismaChantierTerritoireModel.chantier_identite.nom,
      codeMinisterePorteur: prismaChantierTerritoireModel.chantier_identite.ministeres.at(0),
    });
  }

}
