import Chantier from '@/server/chantiers/domain/Chantier.interface';
import Indicateur from '@/server/chantiers/domain/Indicateur';
import { DétailsIndicateur } from '@/server/chantiers/domain/DétailsIndicateur';
import { Météo } from '@/server/chantiers/domain/Meteo';

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
  valeurActuelle: DétailsIndicateur['valeurActuelle'] | null,
  dateValeurActuelle: DétailsIndicateur['dateValeurActuelle'],
  périmètreIds: string[],
  météo: Météo | null,
  chantierEstBaromètre: Chantier['estBaromètre'] | null,
  chantierStatut: Chantier['statut'] | null,
  chantierEstTerritorialise: Chantier['estTerritorialisé'] | null,
  maillesApplicables: string[]
  estApplicable: boolean | null
};
