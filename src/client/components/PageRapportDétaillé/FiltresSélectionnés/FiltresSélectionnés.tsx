import Titre from '@/components/_commons/Titre/Titre';
import FiltresSélectionnésStyled from './FiltresSélectionnés.styled';
import FiltresSélectionnésCatégorie from './Catégorie/FiltresSélectionnésCatégorie';
import { FiltresSélectionnésProps } from './FiltresSélectionnés.interface';

export default function FiltresSélectionnés({ territoireSélectionné, filtresActifs }: FiltresSélectionnésProps) {
  const filtresCatégories = [
    { nom: 'Territoire', filtres: [territoireSélectionné!.nomAffiché] },
    { nom: 'Périmètres ministériels', filtres: filtresActifs.périmètresMinistériels.map(({ nom }) => nom) },
    { nom: 'Axes', filtres: filtresActifs.axes.map(({ nom }) => nom) },
    { nom: 'PPG', filtres: filtresActifs.ppg.map(({ nom }) => nom) },
    { nom: 'Autres critères', filtres: filtresActifs.filtresTypologie.map(({ nom }) => nom) },
    { nom: 'Alertes', filtres: filtresActifs.filtresAlerte.map(({ nom }) => nom) },
  ];

  return (
    <FiltresSélectionnésStyled className='fr-mb-6w'>
      <Titre
        baliseHtml="h2"
        className='fr-text--lg filtres-sélectionnés__titre'
      >
        Contenu du rapport détaillé
      </Titre>
      <div className='filtres-sélectionnés__conteneur'>
        { filtresCatégories.map(({ nom, filtres }) => (
          <FiltresSélectionnésCatégorie
            filtres={filtres}
            key={nom}
            titre={nom}
          />
        )) }
      </div>
    </FiltresSélectionnésStyled>
  );
}
