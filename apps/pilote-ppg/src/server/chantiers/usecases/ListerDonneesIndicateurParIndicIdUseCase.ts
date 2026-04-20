import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { DonneeIndicateur } from "@/server/chantiers/domain/DonneeIndicateur";
import type { Inject } from "@/server/chantiers/module";

export class ListerDonneesIndicateurParIndicIdUseCase {
  private indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Inject<"indicateurRepository">) {
    this.indicateurRepository = indicateurRepository;
  }

  async run({
    indicId,
    jalon,
  }: {
    indicId: string;
    jalon: number;
  }): Promise<DonneeIndicateur[]> {
    return this.indicateurRepository.listerParIndicId({ indicId, jalon });
  }
}
