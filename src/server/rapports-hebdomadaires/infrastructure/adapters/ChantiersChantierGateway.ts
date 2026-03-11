import {
  type ChantierGateway,
  type ChantierAvecIndicateurs,
} from "@/server/rapports-hebdomadaires/domain/ports/ChantierGateway";
import type { Inject } from "@/server/rapports-hebdomadaires/module";

export class ChantiersChantierGateway implements ChantierGateway {
  constructor(private readonly deps: Inject<"recupererChantiersQuery">) {}

  async recupererChantiersAccessibles(params: {
    territoireCodes: string[];
  }): Promise<Record<string, ChantierAvecIndicateurs>> {
    return this.deps.recupererChantiersQuery.execute(params);
  }
}
