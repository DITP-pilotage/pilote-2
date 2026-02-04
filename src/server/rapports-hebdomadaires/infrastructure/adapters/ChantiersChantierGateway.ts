import {
  ChantierGateway,
  ChantierAvecIndicateurs,
} from "@/server/rapports-hebdomadaires/domain/ports/ChantierGateway";
import { RecupererChantiersParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersParTerritoiresQuery";

export class ChantiersChantierGateway implements ChantierGateway {
  constructor(
    private readonly deps: {
      recupererChantiersQuery: RecupererChantiersParTerritoiresQuery;
    },
  ) {}

  async recupererChantiersAccessibles(params: {
    territoireCodes: string[];
  }): Promise<Record<string, ChantierAvecIndicateurs>> {
    return this.deps.recupererChantiersQuery.execute(params);
  }
}
