import Chantier from "@/server/domain/chantier/Chantier.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { TerritoireRepository } from "@/server/chantiers/domain/ports/TerritoireRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { MinistereRepository } from "@/server/chantiers/domain/ports/MinistereRepository";
import { presenterEnChantierContrat } from "@/server/chantiers/app/contrats/ChantierContrat";

interface Dependencies {
  chantierRepository: ChantierRepository;
  ministereRepository: MinistereRepository;
  territoireRepository: TerritoireRepository;
}

export default class RecupererChantierUseCaseV2 {
  private chantierRepository: ChantierRepository;

  private ministereRepository: MinistereRepository;

  private territoireRepository: TerritoireRepository;

  constructor({
    chantierRepository,
    ministereRepository,
    territoireRepository,
  }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.ministereRepository = ministereRepository;
    this.territoireRepository = territoireRepository;
  }

  async run(
    chantierId: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ): Promise<Chantier> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    const ministères = await this.ministereRepository.getListe();
    const territoires = await this.territoireRepository.récupérerTousNew();
    const chantierRows =
      await this.chantierRepository.recupererLesEntreesDUnChantier(
        chantierId,
        habilitations,
        profil,
        jalon,
      );
    return presenterEnChantierContrat(chantierRows, territoires, ministères);
  }
}
