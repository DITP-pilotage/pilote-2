import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import {
  aujourdhuiAParis,
  statutPeriode,
} from "@/server/formations/domain/periodeInformation";
import { bornesDepuisBase } from "@/server/formations/infrastructure/joursBase";
import { verrouillerPeriodes } from "@/server/formations/infrastructure/verrouPeriodes";
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
      await verrouillerPeriodes(client);

      const periode = await client.formation_periode_information.findUnique({
        where: { id },
      });
      if (!periode) {
        throw new BadRequestError("Cette période n'existe plus.");
      }
      if (
        statutPeriode(
          bornesDepuisBase(periode),
          aujourdhuiAParis(maintenant),
        ) !== "A_VENIR"
      ) {
        throw new BadRequestError(
          "Seule une période à venir peut être supprimée.",
        );
      }
      // La suppression emporte en cascade les motifs de la période.
      await client.formation_periode_information.delete({ where: { id } });
    });
  }
}
