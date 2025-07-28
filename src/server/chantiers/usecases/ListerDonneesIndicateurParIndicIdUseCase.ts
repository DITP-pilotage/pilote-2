import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { DonneeIndicateur } from "@/server/chantiers/domain/DonneeIndicateur";

interface Dependencies {
  indicateurRepository: IndicateurRepository;
}

export class ListerDonneesIndicateurParIndicIdUseCase {
  private indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
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
