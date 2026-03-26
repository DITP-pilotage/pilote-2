import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { MailleNonAutoriséeErreur } from "@/server/utils/errors";
import type { Inject } from "@/server/chantiers/module";
import { GetStatistiquesAvancementChantiersQuery } from "@/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery";

export class RécupérerStatistiquesAvancementChantiersUseCase {
  private readonly getStatistiquesAvancementChantiersQuery: GetStatistiquesAvancementChantiersQuery;

  constructor({
    getStatistiquesAvancementChantiersQuery,
  }: Inject<"getStatistiquesAvancementChantiersQuery">) {
    this.getStatistiquesAvancementChantiersQuery =
      getStatistiquesAvancementChantiersQuery;
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

    return this.getStatistiquesAvancementChantiersQuery.execute({
      habilitations,
      listeChantier: chantiers,
      maille,
      jalon,
    });
  }
}
