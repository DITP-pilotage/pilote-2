import {
  ChantierGateway,
  ChantierAvecIndicateurs,
} from "@/server/rapports-hebdomadaires/domain/ports/ChantierGateway";
import { RecupererIndicateursParChantiersQuery } from "@/server/chantiers/infrastructure/queries/RecupererIndicateursParChantiersQuery";

export class ChantiersChantierGateway implements ChantierGateway {
  constructor(
    private readonly deps: {
      recupererIndicateursQuery: RecupererIndicateursParChantiersQuery;
    },
  ) {}

  async recupererIndicateursParChantiers(
    chantierIds: string[],
  ): Promise<Record<string, ChantierAvecIndicateurs>> {
    const { chantiers, indicateurs } =
      await this.deps.recupererIndicateursQuery.execute(chantierIds);

    const result: Record<string, ChantierAvecIndicateurs> = {};
    for (const [chantierId, chantier] of Object.entries(chantiers)) {
      result[chantierId] = {
        id: chantier.id,
        nom: chantier.nom,
        indicateurs: (indicateurs[chantierId] || []).map((indic) => ({
          id: indic.id,
          nom: indic.nom,
        })),
      };
    }

    return result;
  }
}
