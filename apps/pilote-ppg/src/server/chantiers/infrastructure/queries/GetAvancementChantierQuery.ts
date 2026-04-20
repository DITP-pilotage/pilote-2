import { Inject } from "@/server/chantiers/module";

export type AvancementChantierViewModel = {
  territoireCode: string;
  maille: string;
  tauxAvancement: number | null;
  dateTauxAvancement: string | null;
};

export class GetAvancementChantierQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierId: string;
    jalon: number;
    territoireCode: string;
  }): Promise<AvancementChantierViewModel[]> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
      select: { code: true, maille: true, code_parent: true },
    });

    const codes = this.construireChaineHierarchiqueTerritoire({
      code: territoire.code,
      maille: territoire.maille,
      codeParent: territoire.code_parent,
    });

    const rows = await prisma.chantier_territoire_jalon.findMany({
      where: {
        id: params.chantierId,
        territoire_code: { in: codes },
        jalon: params.jalon,
      },
    });

    return rows.map((row) => ({
      territoireCode: row.territoire_code,
      maille: row.maille,
      tauxAvancement: row.taux_avancement,
      dateTauxAvancement: row.date_taux_avancement?.toISOString() ?? null,
    }));
  }

  private construireChaineHierarchiqueTerritoire(territoire: {
    code: string;
    maille: string;
    codeParent: string | null;
  }): string[] {
    switch (territoire.maille) {
      case "DEPT":
        return [territoire.code, territoire.codeParent!, "NAT-FR"];
      case "REG":
        return [territoire.code, "NAT-FR"];
      case "NAT":
        return ["NAT-FR"];
      default:
        return [territoire.code];
    }
  }
}
