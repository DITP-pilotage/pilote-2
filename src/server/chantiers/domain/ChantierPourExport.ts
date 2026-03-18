import { Meteo } from "@/server/domain/météo/Météo.interface";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import Alerte from "@/server/domain/alerte/Alerte";
import { ChantierTendance } from "@/server/domain/chantier/Chantier.interface";

export type ChantierPourExport = {
  nom: string | null;
  id: string | null;
  maille: string | null;
  régionNom: string | null;
  départementNom: string | null;
  codeInsee: string | null;
  ministèreNom: string | null;
  axe: string | null;
  périmètreIds: string[];
  tauxDAvancement: number | null;
  tauxDAvancementJalonParDefaut: number | null;
  tauxDAvancementNational: number | null;
  tauxDAvancementRégional: number | null;
  tauxDAvancementDépartemental: number | null;
  météo: Meteo | null;
  directeursProjet: string[] | null;
  directeursProjetMails: string[] | null;
  responsablesLocaux: string[] | null;
  responsablesLocauxMails: string[] | null;
  coordinateursTerritoriaux: string[] | null;
  coordinateursTerritoriauxMails: string[] | null;
  estBaromètre: boolean | null;
  estTerritorialisé: boolean | null;
  statut: string | null;
  commActionsÀVenir: string | null;
  commActionsÀValoriser: string | null;
  commFreinsÀLever: string | null;
  commCommentairesSurLesDonnées: string | null;
  commAutresRésultats: string | null;
  commAutresRésultatsNonCorrélésAuxIndicateurs: string | null;
  decStratSuiviDesDécisions: string | null;
  objNotreAmbition: string | null;
  objDéjàFait: string | null;
  objÀFaire: string | null;
  synthèseDesRésultats: string | null;
  ecart: number | null;
  tendance: ChantierTendance | null;
  cibleAttendu: boolean;
  aUnePropositionsValeurAvancement: boolean;
  aUnTauxAvancementDepartemental: boolean;
};

export const verifierOptionPerimetreIds = (
  optionsExport: OptionsExport,
  perimetreIds: string[],
) => {
  return optionsExport.perimetreIds.length > 0
    ? optionsExport.perimetreIds.some((perimetreId) =>
        perimetreIds.includes(perimetreId),
      )
    : true;
};

export const verifierOptionEstBarometreEtEstTerritorialise = (
  optionsExport: OptionsExport,
  estBaromètre: boolean | null,
) => {
  return optionsExport.estBarometre ? !!estBaromètre : true;
};

export const verifierOptionStatut = (
  optionsExport: OptionsExport,
  chantierStatut: string | null,
) => {
  return chantierStatut
    ? optionsExport.listeStatuts.length > 0
      ? optionsExport.listeStatuts.includes(chantierStatut)
      : true
    : true;
};

export const verifierOptionMeteo = (
  optionsExport: OptionsExport,
  chantierMeteo: string | null,
) => {
  return optionsExport.listeMeteos.length > 0
    ? chantierMeteo
      ? optionsExport.listeMeteos.includes(chantierMeteo)
      : false
    : true;
};

export const masquerPourProfilDROM = (
  profil: ProfilCode,
  périmètreIds: string[],
) => {
  return profil == ProfilEnum.DROM && !périmètreIds.includes("PER-018");
};
export const masquerPourProfilDROMEtMailleNat = (
  profil: ProfilCode,
  périmètreIds: string[],
  maille: string | null,
) => {
  return masquerPourProfilDROM(profil, périmètreIds) && maille === "NAT";
};

export const verifierOptionChantiersSignales = (
  optionsExport: OptionsExport,
  chantierEcart: number | null,
  chantierTendance: ChantierTendance | null,
  chantierAvancementTerritoire: number | null,
  chantierCibleAttendue: boolean,
  chantierAUnTauxAvancementDepartemental: boolean,
  chantierMeteo: Meteo,
  chantierAUnePropositionsValeurAvancement: boolean,
) => {
  if (
    optionsExport.estEnAlerteAbscenceTauxAvancementDepartemental ||
    optionsExport.estEnAlerteBaisse ||
    optionsExport.estEnAlerteMétéoNonRenseignée ||
    optionsExport.estEnAlertePossedePropositionsValeurAvancement ||
    optionsExport.estEnAlerteTauxAvancementNonCalculé ||
    optionsExport.estEnAlerteÉcart
  ) {
    return (
      (optionsExport.estEnAlerteÉcart &&
        Alerte.estEnAlerteÉcart(chantierEcart)) ||
      (optionsExport.estEnAlerteBaisse &&
        Alerte.estEnAlerteBaisse(chantierTendance)) ||
      (optionsExport.estEnAlerteTauxAvancementNonCalculé &&
        Alerte.estEnAlerteTauxAvancementNonCalculé(
          chantierAvancementTerritoire,
          chantierCibleAttendue,
        )) ||
      (optionsExport.estEnAlerteAbscenceTauxAvancementDepartemental &&
        Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
          chantierAUnTauxAvancementDepartemental,
          chantierCibleAttendue,
        )) ||
      (optionsExport.estEnAlerteMétéoNonRenseignée &&
        Alerte.estEnAlerteMétéoNonRenseignée(chantierMeteo)) ||
      (optionsExport.estEnAlertePossedePropositionsValeurAvancement &&
        Alerte.estEnAlertePossedePropositionsValeurAvancement(
          chantierAUnePropositionsValeurAvancement,
        ))
    );
  } else {
    return true;
  }
};
