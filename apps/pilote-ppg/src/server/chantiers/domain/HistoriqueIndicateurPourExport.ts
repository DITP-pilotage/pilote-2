import {
  Chantier,
  ChantierTendance,
} from "@/shared/chantier/Chantier.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Meteo } from "@/shared/meteo/Meteo.interface";

export type HistoriqueIndicateurPourExport = {
  maille: string;
  régionNom: string | null;
  départementNom: string | null;
  codeInsee: string | null;
  chantierNom: Chantier["nom"] | null;
  chantierId: Chantier["id"] | null;
  nom: Indicateur["nom"] | null;
  valeurInitiale: DétailsIndicateur["valeurInitiale"] | null;
  dateValeurInitiale: DétailsIndicateur["dateValeurInitiale"] | null;
  valeurCibleAnnuelle: DétailsIndicateur["valeurCible"] | null;
  dateValeurCibleAnnuelle: DétailsIndicateur["dateValeurCible"] | null;
  valeurCible: DétailsIndicateur["valeurCible"] | null;
  dateValeurCible: DétailsIndicateur["dateValeurCible"] | null;
  valeurAvancement: DétailsIndicateur["valeurAvancement"] | null;
  dateValeurAvancement: DétailsIndicateur["dateValeurAvancement"];
  périmètreIds: string[];
  météo: Meteo | null;
  chantierEstBaromètre: Chantier["estBaromètre"] | null;
  chantierStatut: Chantier["statut"] | null;
  chantierEstTerritorialise: Chantier["estTerritorialisé"] | null;
  maillesApplicables: string[];
  estApplicable: boolean | null;
  chantierEcart: number | null;
  chantierTendance: ChantierTendance | null;
  chantierCibleAttendue: boolean;
  chantierAUnTauxAvancementDepartemental: boolean;
  chantierAUnePropositionValeurAvancement: boolean;
  chantierAvancementGlobal: number | null;
};
