import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/annuaire/module";
import {
  lirePersonnes,
  MAILLES_ANNUAIRE,
  type PersonneAnnuaire,
  personnesRetenues,
  selectionTerritoire,
  type TerritoireAnnuaire,
  versTerritoireAnnuaire,
} from "./personnesAnnuaire";

export type AffectationCoordinateur = {
  personneId: string;
  territoire: TerritoireAnnuaire;
};

export type AnnuaireCoordinateurs = {
  personnes: PersonneAnnuaire[];
  affectations: AffectationCoordinateur[];
};

export class ListerCoordinateursAnnuaireQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<AnnuaireCoordinateurs> {
    const prisma = this.prisma.getInstance();

    const lignes = await prisma.chantier_territoire.findMany({
      where: {
        maille: { in: MAILLES_ANNUAIRE },
        coordinateurs_territoriaux_ids: { isEmpty: false },
      },
      distinct: ["territoire_code"],
      orderBy: { territoire_code: "asc" },
      select: {
        coordinateurs_territoriaux_ids: true,
        territoire: { select: selectionTerritoire },
      },
    });

    const personnes = await lirePersonnes(
      prisma,
      lignes.flatMap((ligne) => ligne.coordinateurs_territoriaux_ids),
    );

    const affectations = lignes.flatMap((ligne) => {
      const territoire = versTerritoireAnnuaire(ligne.territoire);
      return ligne.coordinateurs_territoriaux_ids
        .filter((id) => personnes.has(id))
        .map((personneId) => ({ personneId, territoire }));
    });

    return {
      personnes: personnesRetenues(affectations, personnes),
      affectations,
    };
  }
}
