import { Ministère } from '@/server/domain/ministère/Ministère.interface';
import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { Avancement } from '@/server/chantiers/domain/Avancement';
import { Météo } from '@/server/chantiers/domain/Meteo';
import { Indicateur } from '@/server/chantiers/domain/Indicateur';
import { DétailsIndicateur } from '@/server/chantiers/domain/DétailsIndicateur';

export type IndicateurPourExport = {
  maille: string
  régionNom: string | null,
  départementNom: string | null,
  codeInsee: string | null,
  chantierMinistèreNom: Ministère['nom'] | null,
  axe: Chantier['axe'] | null,
  chantierNom: Chantier['nom'] | null,
  chantierId: Chantier['id'] | null,
  chantierStatut: Chantier['statut'] | null,
  chantierEstBaromètre: Chantier['estBaromètre'] | null,
  chantierEstTerritorialise: Chantier['estTerritorialisé'] | null,
  chantierEstApplicable: boolean | null,
  chantierAvancementGlobal: Avancement['global'] | null,
  chantierAvancementAnnuel: Avancement['annuel'] | null,
  périmètreIds: string[],
  météo: Météo | null,
  nom: Indicateur['nom'] | null,
  valeurInitiale: DétailsIndicateur['valeurInitiale'] | null,
  dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'] | null,
  valeurActuelle: DétailsIndicateur['valeurActuelle'] | null,
  dateValeurActuelle: DétailsIndicateur['dateValeurActuelle'] | null,
  valeurCibleAnnuelle: DétailsIndicateur['valeurCible'] | null,
  dateValeurCibleAnnuelle: DétailsIndicateur['dateValeurCible'] | null,
  avancementAnnuel: DétailsIndicateur['avancement']['global'] | null,
  valeurCible: DétailsIndicateur['valeurCible'] | null,
  dateValeurCible: DétailsIndicateur['dateValeurCible'] | null,
  avancementGlobal: DétailsIndicateur['avancement']['global'] | null,
  maillesApplicables: string[]
  estApplicable: boolean | null
};

export const verifierApplicabiliteMaille = (maillesApplicablesIndicateur: string[], maille: string) => {
  return maillesApplicablesIndicateur.includes(maille);
};
