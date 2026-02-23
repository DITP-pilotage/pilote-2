import Ministère from "@/server/domain/ministère/Ministère.interface";
import Chantier, {
  ChantierTendance,
} from "@/server/domain/chantier/Chantier.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";

export type IndicateurPourExport = {
  maille: string;
  régionNom: string | null;
  départementNom: string | null;
  codeInsee: string | null;
  chantierMinistèreNom: Ministère["nom"] | null;
  axe: Chantier["axe"] | null;
  chantierNom: Chantier["nom"] | null;
  chantierId: Chantier["id"] | null;
  chantierStatut: Chantier["statut"] | null;
  chantierEstBaromètre: Chantier["estBaromètre"] | null;
  chantierEstTerritorialise: Chantier["estTerritorialisé"] | null;
  chantierEstApplicable: boolean | null;
  chantierAvancement: number | null;
  chantierAvancementJalonParDefaut: number | null;
  périmètreIds: string[];
  météo: Météo | null;
  nom: Indicateur["nom"] | null;
  valeurInitiale: number | null;
  dateValeurInitiale: string | null;
  valeurAvancement: number | null;
  dateValeurAvancement: string | null;
  valeurCible: number | null;
  dateValeurCible: string | null;
  avancement: number | null;
  maillesApplicables: string[];
  estApplicable: boolean | null;
  chantierEcart: number | null;
  chantierTendance: ChantierTendance | null;
  chantierCibleAttendue: boolean;
  chantierAUnTauxAvancementDepartemental: boolean;
  chantierAUnePropositionValeurAvancement: boolean;
  description: string | null;
  methodeCalcul: string | null;
  source: string | null;
  periodesMiseAJour: string | null;
  delaiDisponibilite: number | null;
};

export const verifierApplicabiliteMaille = (
  maillesApplicablesIndicateur: string[],
  maille: string,
) => {
  return maillesApplicablesIndicateur.includes(maille);
};
