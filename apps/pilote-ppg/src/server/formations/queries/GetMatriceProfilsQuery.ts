import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/formations/module";

export interface MatriceProfils {
  profils: { code: string; nom: string }[];
  motifs: { id: number; nom: string }[];
  associations: { motifId: number; profilCode: string }[];
}

export class GetMatriceProfilsQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<MatriceProfils> {
    const client = this.prisma.getInstance();
    const [profils, motifs] = await Promise.all([
      client.profil.findMany({
        select: { code: true, nom: true },
        orderBy: { nom: "asc" },
      }),
      client.formation_motif.findMany({
        where: { date_suppression: null },
        select: {
          id: true,
          nom: true,
          profils: {
            select: { profil_code: true },
            orderBy: { profil_code: "asc" },
          },
        },
        orderBy: { nom: "asc" },
      }),
    ]);

    return {
      profils,
      motifs: motifs.map((motif) => ({ id: Number(motif.id), nom: motif.nom })),
      associations: motifs.flatMap((motif) =>
        motif.profils.map((association) => ({
          motifId: Number(motif.id),
          profilCode: association.profil_code,
        })),
      ),
    };
  }
}
