import {
  ChantierGateway,
  ChantierAvecIndicateurs,
} from "@/server/rapports-hebdomadaires/domain/ports/ChantierGateway";
import { RecupererChantiersApplicablesParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersApplicablesParTerritoiresQuery";

export class ChantiersChantierGateway implements ChantierGateway {
  constructor(
    private readonly deps: {
      recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
    },
  ) {}

  async recupererChantiersAccessibles(params: {
    territoireCodes: string[];
  }): Promise<Record<string, ChantierAvecIndicateurs>> {
    return this.deps.recupererChantiersQuery.execute(params);
  }
}
