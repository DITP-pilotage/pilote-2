import { $Enums } from "@prisma/client";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import type { Inject } from "@/server/chantiers/module";

export class GetChantiersHabilitesQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(habilitations: Habilitations): Promise<string[]> {
    const chantiersAutorises = new Habilitation(
      habilitations,
    ).récupérerListeChantiersIdsAccessiblesEnLecture();

    const rows = await this.deps.prisma
      .getInstance()
      .chantier_identite.findMany({
        where: {
          id: { in: chantiersAutorises },
          statut: $Enums.type_statut.PUBLIE,
          NOT: { ministeres: { isEmpty: true } },
        },
        select: { id: true },
      });

    return rows.map((row) => row.id);
  }
}
