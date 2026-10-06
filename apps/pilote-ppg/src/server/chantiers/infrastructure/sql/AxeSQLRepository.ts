import { Prisma } from "@prisma/client";
import { AxeRepository } from "@/server/chantiers/infrastructure/sql/AxeRepository.interface";
import { Axe } from "@/shared/axe/Axe.interface";
import { prisma } from "@/server/framework/persistence/prisma";

export class AxeSQLRepository implements AxeRepository {
  async getListe(): Promise<Axe[]> {
    return prisma.axe.findMany();
  }

  async getListePourChantiers(chantierIds: string[]): Promise<Axe[]> {
    return prisma.$queryRaw<Axe[]>`
    WITH axe_liste AS (
      select DISTINCT c.axe as axe_id from chantier_identite c where  c.id IN (${Prisma.join(chantierIds)})
    )
    select a.*
    from axe a
    JOIN axe_liste al ON al.axe_id = a.nom
    `;
  }
}
