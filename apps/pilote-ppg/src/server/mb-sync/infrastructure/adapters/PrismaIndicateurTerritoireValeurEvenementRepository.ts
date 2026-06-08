import { Prisma } from "@prisma/client";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { type PrismaPilote } from "@/server/db/PrismaPilote";
import {
  type EvenementValeurDelta,
  type IndicateurTerritoireValeurEvenementRepository,
} from "@/server/mb-sync/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export class PrismaIndicateurTerritoireValeurEvenementRepository implements IndicateurTerritoireValeurEvenementRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async recupererEvenementsModifiesDepuis(args: {
    indicId: string;
    dateMin: Date;
  }): Promise<EvenementValeurDelta[]> {
    return this.prisma.$queryRaw<EvenementValeurDelta[]>(
      Prisma.sql`
        SELECT DISTINCT ON (ev.indic_id, ev.territoire_code, ev.date_valeur)
          ev.indic_id AS "indicId",
          ev.territoire_code,
          ev.date_valeur AS "dateValeur",
          ev.valeur
        FROM indicateur_territoire_valeur_evenement ev
        JOIN territoire t ON t.code = ev.territoire_code
        JOIN indicateur_identite ii ON ii.id = ev.indic_id
        WHERE ev.indic_id = ${args.indicId}
          AND ev.type_evenement::text IN (${Prisma.join([
            EvenementValeurEnum.VALEUR_CREEE,
            EvenementValeurEnum.VALEUR_MODIFIEE,
          ])})
          AND ev.date_modification > ${args.dateMin}
          AND t.maille = ANY(ii.mailles_applicables)
        ORDER BY ev.indic_id, ev.territoire_code, ev.date_valeur, ev.ordre DESC
      `,
    );
  }
}
