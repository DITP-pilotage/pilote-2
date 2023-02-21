import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementChantierProps from './AvancementChantier.interface';

export default function AvancementChantier({ avancements }: AvancementChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  return (
    <div
      id="avancement"
    >
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Avancement du chantier
      </Titre>
      {
        avancements.départementale.moyenne !== undefined &&
        <Bloc titre={territoireSélectionné.nom}>
          <JaugeDeProgression
            couleur="bleu"
            libellé={territoireSélectionné.nom}
            pourcentage={avancements.départementale.moyenne}
            taille="grande"
          />
        </Bloc>
      }
      {
        avancements.régionale.moyenne !== undefined && 
        <Bloc titre={territoireSélectionné.territoireParent ? territoireSélectionné.territoireParent.nom : territoireSélectionné.nom}>
          <JaugeDeProgression
            couleur="bleu"
            libellé={territoireSélectionné.territoireParent ? territoireSélectionné.territoireParent.nom : territoireSélectionné.nom}
            pourcentage={avancements.régionale.moyenne}
            taille="grande"
          />
        </Bloc>
      }
      <Bloc titre='National'>
        <div className='fr-py-4w'>
          <Avancements avancements={avancements.nationale} />
        </div>
      </Bloc>
    </div>
  );
}
