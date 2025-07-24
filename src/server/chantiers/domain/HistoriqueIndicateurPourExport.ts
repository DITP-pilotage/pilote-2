import Chantier, { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export type HistoriqueIndicateurPourExport = {
  maille: string,
  régionNom: string | null,
  départementNom: string | null,
  codeInsee: string | null,
  chantierNom: Chantier['nom'] | null,
  chantierId: Chantier['id'] | null,
  nom: Indicateur['nom'] | null,
  valeurInitiale: DétailsIndicateur['valeurInitiale'] | null,
  dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'] | null,
  valeurCibleAnnuelle: DétailsIndicateur['valeurCible'] | null,
  dateValeurCibleAnnuelle: DétailsIndicateur['dateValeurCible'] | null,
  valeurCible: DétailsIndicateur['valeurCible'] | null,
  dateValeurCible: DétailsIndicateur['dateValeurCible'] | null,
  valeurAvancement: DétailsIndicateur['valeurAvancement'] | null,
  dateValeurAvancement: DétailsIndicateur['dateValeurAvancement'],
  périmètreIds: string[],
  météo: Météo | null,
  chantierEstBaromètre: Chantier['estBaromètre'] | null,
  chantierStatut: Chantier['statut'] | null,
  chantierEstTerritorialise: Chantier['estTerritorialisé'] | null,
  maillesApplicables: string[]
  estApplicable: boolean | null
  chantierEcart: number | null
  chantierTendance: ChantierTendance | null
  chantierCibleAttendue: boolean
  chantierAUnTauxAvancementDepartemental: boolean
  chantierAUnePropositionValeurAvancement: boolean
  chantierAvancementGlobal: number | null
};
