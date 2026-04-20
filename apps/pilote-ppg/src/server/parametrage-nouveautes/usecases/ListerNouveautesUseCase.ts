import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";
import { NouveauteRepository } from "@/server/parametrage-nouveautes/domain/ports/NouveauteRepository";
import type { Inject } from "@/server/parametrage-nouveautes/module";

export class ListerNouveautesUseCase {
  private nouveauteRepository: NouveauteRepository;

  constructor({ nouveauteRepository }: Inject<"nouveauteRepository">) {
    this.nouveauteRepository = nouveauteRepository;
  }

  async execute(): Promise<Nouveaute[]> {
    return this.nouveauteRepository.listerNouveautes();
  }
}
