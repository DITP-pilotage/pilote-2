import { z } from "zod";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import type { Inject } from "@/server/formations/module";

export const setMotifProfilCommandSchema = z.object({
  motifId: z.number().int(),
  profilCode: z.string().min(1),
  propose: z.boolean(),
});

export type SetMotifProfilCommand = z.infer<typeof setMotifProfilCommandSchema>;

export class SetMotifProfilHandler {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute(commande: SetMotifProfilCommand): Promise<void> {
    const client = this.prisma.getInstance();
    const motifId = BigInt(commande.motifId);

    const [motif, profil] = await Promise.all([
      client.formation_motif.findFirst({
        where: { id: motifId, date_suppression: null },
      }),
      client.profil.findUnique({ where: { code: commande.profilCode } }),
    ]);
    if (!motif) {
      throw new BadRequestError(
        "Cette formation n'existe pas ou a été supprimée dans RDV-SP.",
      );
    }
    if (!profil) {
      throw new BadRequestError("Ce profil n'existe pas.");
    }

    const association = { motif_id: motifId, profil_code: commande.profilCode };
    if (commande.propose) {
      await client.formation_motif_profil.createMany({
        data: [association],
        skipDuplicates: true,
      });
    } else {
      await client.formation_motif_profil.deleteMany({ where: association });
    }
  }
}
