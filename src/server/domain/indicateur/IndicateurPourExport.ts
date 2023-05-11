import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Avancement from '@/server/domain/avancement/Avancement.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export type IndicateurPourExport = {
  maille: Maille,
  régionNom: string | null,
  départementNom: string | null,
  chantierMinistèreNom: Ministère['nom'],
  chantierNom: Chantier['nom'],
  chantierEstBaromètre: Chantier['estBaromètre'],
  chantierAvancementGlobal: Avancement['global'],
  météo: Météo,
  nom: Indicateur['nom'],
  valeurInitiale: DétailsIndicateur['valeurInitiale'],
  dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'],
  valeurActuelle: DétailsIndicateur['valeurs'][number],
  dateValeurActuelle: DétailsIndicateur['dateValeurs'][number],
  valeurCible: DétailsIndicateur['valeurCible'],
  dateValeurCible: DétailsIndicateur['dateValeurCible'],
  avancementGlobal: DétailsIndicateur['avancement']['global'],
};
