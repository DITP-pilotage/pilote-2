import { Météo } from '@/server/domain/météo/Météo.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

export type ChantierPourExport = {
  nom: string | null,
  id: string | null,
  maille: string | null,
  régionNom: string | null,
  départementNom: string | null,
  codeInsee: string | null,
  ministèreNom: string | null,
  axe: string | null,
  périmètreIds: string[],
  tauxDAvancementAnnuel: number | null,
  tauxDAvancementNational: number | null,
  tauxDAvancementRégional: number | null,
  tauxDAvancementDépartemental: number | null,
  météo: Météo | null,
  directeursProjet: string[] | null,
  directeursProjetMails: string[] | null,
  responsablesLocaux: string[] | null,
  responsablesLocauxMails: string[] | null,
  estBaromètre: boolean | null,
  estTerritorialisé: boolean | null,
  statut: string | null,
  commActionsÀVenir: string | null,
  commActionsÀValoriser: string | null,
  commFreinsÀLever: string | null,
  commCommentairesSurLesDonnées: string | null,
  commAutresRésultats: string | null,
  commAutresRésultatsNonCorrélésAuxIndicateurs: string | null,
  decStratSuiviDesDécisions: string | null,
  objNotreAmbition: string | null,
  objDéjàFait: string | null,
  objÀFaire: string | null,
  synthèseDesRésultats: string | null,
};

export const verifierOptionPerimetreIds = (optionsExport: OptionsExport, perimetreIds: string[]) => {
  return optionsExport.perimetreIds.length > 0 ? optionsExport.perimetreIds.some(perimetreId => perimetreIds.includes(perimetreId)) : true;
};

export const verifierOptionEstBarometreEtEstTerritorialise = (optionsExport: OptionsExport, estBaromètre: boolean | null, estTerritorialisé: boolean | null) => {
  return optionsExport.estBarometre && optionsExport.estTerritorialise ? estBaromètre || estTerritorialisé : optionsExport.estBarometre ? !!estBaromètre : optionsExport.estTerritorialise ? !!estTerritorialisé : true;
};

export const verifierOptionStatut = (optionsExport: OptionsExport, chantierStatut: string | null) => {
  return chantierStatut ? optionsExport.listeStatuts.length > 0 ? optionsExport.listeStatuts.includes(chantierStatut) : true : true;
};

export const verifierOptionMeteo = (optionsExport: OptionsExport, chantierMeteo: string | null) => {
  return optionsExport.listeMeteos.length > 0 ? chantierMeteo ? optionsExport.listeMeteos.includes(chantierMeteo) : false : true ;
};

export const masquerPourProfilDROM = (profil: ProfilCode, périmètreIds : string[]) => {
  return profil == ProfilEnum.DROM && !périmètreIds.includes('PER-018');
};
export const masquerPourProfilDROMEtMailleNat = (profil: ProfilCode, périmètreIds : string[], maille: string | null) => {
  return masquerPourProfilDROM(profil, périmètreIds) && maille === 'NAT';
};
