import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { toISODate } from "@/server/app/domain/Dates";
import { statutPeriode } from "@/server/formations/domain/periodeInformation";
import type { Inject } from "@/server/formations/module";

export class DeletePeriodeInformationHandler {
  private readonly prisma: PrismaPilote;

  private readonly transaction: Inject<"transaction">["transaction"];

  constructor({ prisma, transaction }: Inject<"prisma" | "transaction">) {
    this.prisma = prisma;
    this.transaction = transaction;
  }

  async execute({
    id,
    maintenant,
  }: {
    id: string;
    maintenant: Date;
  }): Promise<void> {
    await this.transaction.run(async () => {
      const client = this.prisma.getInstance();
      const periode = await client.formation_periode_information.findUnique({
        where: { id },
      });
      if (!periode) {
        throw new BadRequestError("Cette période n'existe plus.");
      }
      const statut = statutPeriode(
        {
          dateDebut: toISODate(periode.date_debut),
          dateFin: toISODate(periode.date_fin),
          supprimee: periode.deleted_at !== null,
        },
        toISODate(maintenant),
      );
      if (statut === "SUPPRIMEE") {
        throw new BadRequestError("Cette période est déjà supprimée.");
      }
      if (statut === "PASSEE") {
        throw new BadRequestError("Une période passée ne se supprime pas.");
      }

      await client.formation_periode_information.update({
        where: { id },
        data: { deleted_at: maintenant },
      });
    });
  }
}
