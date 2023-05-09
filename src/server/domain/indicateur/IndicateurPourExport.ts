import { Maille } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Avancement from '@/server/domain/avancement/Avancement.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export class IndicateurPourExport {
  constructor(
    public readonly maille: Maille,
    public readonly codeRégion: string | null,
    public readonly codeDépartement: string | null,
    public readonly chantierMinistèreNom: Ministère['nom'],
    public readonly chantierNom: Chantier['nom'],
    public readonly chantierEstBaromètre: Chantier['estBaromètre'],
    public readonly chantierAvancementGlobal: Avancement['global'],
    public readonly météo: Météo,
    public readonly nom: Indicateur['nom'],
    public readonly valeurInitiale: DétailsIndicateur['valeurInitiale'],
    public readonly dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'],
    public readonly valeurActuelle: DétailsIndicateur['valeurs'][number],
    public readonly dateValeurActuelle: DétailsIndicateur['dateValeurs'][number],
    public readonly valeurCible: DétailsIndicateur['valeurCible'],
    public readonly dateValeurCible: DétailsIndicateur['dateValeurCible'],
    public readonly avancementGlobal: DétailsIndicateur['avancement']['global'],
  ) {}
}
