import { Inject } from "@/server/chantiers/module";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

export type PVATerritoireViewModel = {
  territoireCode: string;
  territoireNom: string;
  codeInsee: string;
  maille: MailleTerritoireSelectionne;
  nombrePropositionsValeur: number;
  estApplicable: boolean | null;
};

export class GetChantierPVATerritoiresQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierId: string;
    jalon: number;
  }): Promise<PVATerritoireViewModel[]> {
    const prisma = this.deps.prisma.getInstance();

    const rows = await prisma.chantier_territoire.findMany({
      where: {
        id: params.chantierId,
        maille: { in: ["NAT", "REG", "DEPT"] },
        chantier_territoire_jalon: {
          some: { jalon: params.jalon },
        },
      },
      include: {
        territoire: true,
      },
    });

    return rows.map((row) => ({
      territoireCode: row.territoire.code,
      territoireNom: row.territoire.nom_affiche,
      codeInsee: row.code_insee,
      maille: row.maille as MailleTerritoireSelectionne,
      nombrePropositionsValeur: row.nombre_propositions_valeur_actuelle,
      estApplicable: row.est_applicable,
    }));
  }
}
