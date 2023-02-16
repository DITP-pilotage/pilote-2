import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementChantierProps from './AvancementChantier.interface';

export default function AvancementChantier({ chantier }: AvancementChantierProps) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
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
        territoireSélectionné.codeInsee !== 'FR' && 
        <Bloc titre={territoireSélectionné.nom}>
          <JaugeDeProgression
            couleur="bleu"
            libellé={territoireSélectionné.nom}
            pourcentage={chantier.mailles[mailleSélectionnée][territoireSélectionné.codeInsee].avancement.global}
            taille="grande"
          />
        </Bloc>
      }
      {
        territoireSélectionné.territoireParent !== undefined && 
        <Bloc titre={territoireSélectionné.territoireParent.nom}>
          <JaugeDeProgression
            couleur="bleu"
            libellé={territoireSélectionné.territoireParent.nom}
            pourcentage={chantier.mailles.régionale[territoireSélectionné.territoireParent.codeInsee].avancement.global}
            taille="grande"
          />
        </Bloc>
      }
      <Bloc titre='National'>
        <div className='fr-py-4w'>
          <Avancements avancements={
              { 
                maximum: null, 
                minimum: null, 
                moyenne: chantier.mailles.nationale.FR.avancement.global,
                médiane: null, 
              }
            }
          />
        </div>
      </Bloc>
    </div>
  );
}
