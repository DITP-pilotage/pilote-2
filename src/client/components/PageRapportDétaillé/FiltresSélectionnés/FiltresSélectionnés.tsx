import Titre from '@/components/_commons/Titre/Titre';
import FiltresSélectionnésStyled from './FiltresSélectionnés.styled';
import FiltresSélectionnésCatégorie from './Catégorie/FiltresSélectionnésCatégorie';
import { FiltresSélectionnésProps } from './FiltresSélectionnés.interface';

export default function FiltresSélectionnés({ territoiresSélectionnés, filtresActifs }: FiltresSélectionnésProps) {
  return (
    <FiltresSélectionnésStyled className='fr-mb-6w'>
      <Titre
        baliseHtml="h2"
        className='fr-text--lg filtres-sélectionnés__titre'
      >
        Contenu du rapport détaillé
      </Titre>
      <div className='filtres-sélectionnés__conteneur'>
        <FiltresSélectionnésCatégorie
          filtres={[territoiresSélectionnés!.nom]}
          titre='Territoire'
        />
        <FiltresSélectionnésCatégorie
          filtres={filtresActifs.périmètresMinistériels.map(({ nom }) => nom)}
          titre='Périmètres ministériels'
        />
        <FiltresSélectionnésCatégorie
          filtres={filtresActifs.axes.map(({ nom }) => nom)}
          titre='Axes'
        />
        <FiltresSélectionnésCatégorie
          filtres={filtresActifs.ppg.map(({ nom }) => nom)}
          titre='PPG'
        />
        <FiltresSélectionnésCatégorie
          filtres={filtresActifs.filtresTypologie.map(({ nom }) => nom)}
          titre='Autres critères'
        />
        <FiltresSélectionnésCatégorie
          filtres={filtresActifs.filtresAlerte.map(({ nom }) => nom)}
          titre='Alertes'
        />
      </div>
    </FiltresSélectionnésStyled>
  );
}
