import Ministère from '@/server/domain/ministère/Ministère.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';
import { DétailsIndicateur } from '@/server/domain/chantier/indicateur/DétailsIndicateur.interface';

export type IndicateurPourExport = {
  maille: string | null,
  régionNom: string | null,
  départementNom: string | null,
  chantierMinistèreNom: Ministère['nom'] | null,
  chantierNom: Chantier['nom'] | null,
  chantierEstBaromètre: Chantier['estBaromètre'] | null,
  chantierAvancementGlobal: Avancement['global'] | null,
  périmètreIds: string[],
  météo: Météo | null,
  nom: Indicateur['nom'] | null,
  valeurInitiale: DétailsIndicateur['valeurInitiale'] | null,
  dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'] | null,
  valeurActuelle: DétailsIndicateur['valeurs'][number] | null,
  dateValeurActuelle: DétailsIndicateur['dateValeurs'][number] | null,
  valeurCible: DétailsIndicateur['valeurCible'] | null,
  dateValeurCible: DétailsIndicateur['dateValeurCible'] | null,
  avancementGlobal: DétailsIndicateur['avancement']['global'] | null,
};
