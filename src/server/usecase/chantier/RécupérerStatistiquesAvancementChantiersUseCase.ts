import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { MailleNonAutoriséeErreur } from "@/server/utils/errors";
import type { Inject } from "@/server/legacy/module";

export default class RécupérerStatistiquesAvancementChantiersUseCase {
  private readonly chantierRepository: ChantierRepository;

  constructor({ chantierRepository }: Inject<"chantierRepository">) {
    this.chantierRepository = chantierRepository;
  }

  async run(
    chantiers: Chantier["id"][],
    maille: Maille,
    habilitations: Habilitations,
    jalon: number,
  ): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const maillesAccessibles =
      habilitation.recupererListeMailleEnLectureDisponible();

    if (!maillesAccessibles.includes(maille)) {
      throw new MailleNonAutoriséeErreur();
    }

    return this.chantierRepository.getChantierStatistiques(
      habilitations,
      chantiers,
      maille,
      jalon,
    );
  }
}
