import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import { récupérerNomTerritoire } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import AvancementChantierProps from './AvancementChantier.interface';

export default function AvancementChantier({ chantier, territoireSélectionné }: AvancementChantierProps) {
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
      {territoireSélectionné.maille !== 'nationale' && (
      <Bloc titre={récupérerNomTerritoire(territoireSélectionné)}>
        <JaugeDeProgression
          couleur="bleu"
          libellé={récupérerNomTerritoire({ codeInsee: territoireSélectionné.codeInsee, maille: territoireSélectionné.maille })}
          pourcentage={chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].avancement.global}
          taille="grande"
        />
      </Bloc>
      )}
      {(territoireSélectionné.maille === 'départementale' && territoireSélectionné.codeInseeRégion !== undefined) && (
        <Bloc titre={récupérerNomTerritoire({ codeInsee: territoireSélectionné.codeInseeRégion, maille: 'régionale' })}>
          <JaugeDeProgression
            couleur="bleu"
            libellé={récupérerNomTerritoire({ codeInsee: territoireSélectionné.codeInseeRégion, maille: 'régionale' })}
            pourcentage={chantier.mailles.régionale[territoireSélectionné.codeInseeRégion].avancement.global}
            taille="grande"
          />
        </Bloc>
      )}
      <Bloc titre='National'>
        <div className='fr-py-4w'>
          <Avancements
            maximum={null}
            minimum={null}
            moyenne={chantier.mailles.nationale.FR.avancement.global}
            médiane={null}
          />
        </div>
      </Bloc>
    </div>
  );
}
