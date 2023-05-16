import Bloc from '@/components/_commons/Bloc/Bloc';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import Titre from '@/components/_commons/Titre/Titre';
import AvancementProjetProps from './AvancementProjet.interface';

export default function AvancementProjet({ territoireNom, avancement }: AvancementProjetProps) {
  return (
    <section id='avancement'>
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Avancement du projet
      </Titre>
      <Bloc titre={territoireNom}>
        <div className='fr-grid-row fr-grid-row--center'>
          <JaugeDeProgression
            couleur='rose'
            libellé="Taux d'avancement global"
            pourcentage={avancement}
            taille='lg'
          />
        </div>
      </Bloc>
    </section>
  );
}
