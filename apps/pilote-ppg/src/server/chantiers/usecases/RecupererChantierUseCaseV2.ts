import Chantier from "@/server/domain/chantier/Chantier.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { TerritoireRepository } from "@/server/chantiers/domain/ports/TerritoireRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { MinistereRepository } from "@/server/chantiers/domain/ports/MinistereRepository";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { presenterEnChantierContrat } from "@/server/chantiers/app/contrats/ChantierContrat";
import type { Inject } from "@/server/chantiers/module";

export default class RecupererChantierUseCaseV2 {
  private chantierRepository: ChantierRepository;

  private ministereRepository: MinistereRepository;

  private territoireRepository: TerritoireRepository;

  private utilisateurRepository: UtilisateurRepository;

  constructor({
    chantierRepository,
    ministereRepository,
    territoireRepository,
    utilisateurRepository,
  }: Inject<
    | "chantierRepository"
    | "ministereRepository"
    | "territoireRepository"
    | "utilisateurRepository"
  >) {
    this.chantierRepository = chantierRepository;
    this.ministereRepository = ministereRepository;
    this.territoireRepository = territoireRepository;
    this.utilisateurRepository = utilisateurRepository;
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
    const allIds = [
      ...new Set([
        ...chantierRows.directeurs_projet_ids,
        ...chantierRows.chantier_territoire.flatMap((t) => [
          ...t.responsables_locaux_ids,
          ...t.coordinateurs_territoriaux_ids,
        ]),
      ]),
    ];
    const utilisateurParId =
      await this.utilisateurRepository.recupererParIds(allIds);
    return presenterEnChantierContrat(
      chantierRows,
      territoires,
      ministères,
      utilisateurParId,
    );
  }
}
