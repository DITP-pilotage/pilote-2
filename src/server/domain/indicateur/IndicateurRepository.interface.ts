import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import {
  DétailsIndicateurMailles,
  DétailsIndicateurs,
} from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export default interface IndicateurRepository {
  récupérerChantierIdAssocié(indicateurId: string): Promise<string>;
  récupérerDétailsParMailles(
    IndicateurId: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ): Promise<DétailsIndicateurMailles>;
  récupérerParChantierId(chantierId: string): Promise<Indicateur[]>;
  récupérerGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<string, Indicateur[]>>;
  récupérerDétailsGroupésParChantierEtParIndicateur(
    chantiersIds: Chantier["id"][],
    maille: Maille,
    codeInsee: CodeInsee,
    jalon: number,
  ): Promise<Record<Chantier["id"], DétailsIndicateurs>>;
  recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
    chantiersIds: Chantier["id"][],
  ): Promise<Indicateur["id"][]>;
}
