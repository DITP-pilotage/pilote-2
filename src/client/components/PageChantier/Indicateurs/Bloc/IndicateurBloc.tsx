import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/PageChantier/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc.interface';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import { IndicateurDétailsParTerritoire } from '../Indicateurs.interface';
import useIndicateurs from '../useIndicateurs';

export default function IndicateurBloc({ indicateur, détailsIndicateur } : IndicateurBlocProps) {
  const { indicateurDétailsParTerritoires, colonnes } = useIndicateurs(détailsIndicateur);  
  
  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <Titre
          baliseHtml="h4"
          className="fr-text--xl fr-mb-1w"
        >
          { !!indicateur.estIndicateurDuBaromètre && 
          <PictoBaromètre
            className='fr-mr-1w' 
            taille={{ mesure: 1.25, unité: 'rem' }} 
          /> }
          { indicateur.nom }
        </Titre>
        <p className='fr-mb-1w information-secondaire texte-gris'>
          Dernière mise à jour : Non renseigné
        </p>
        <p className='fr-mb-1w information-secondaire texte-gris'>
          Source : Non renseigné
        </p>
        <p className="fr-text--xs fr-mb-1v">
          Ceci est la description de l’indicateur et des données associées. La pondération de l’indicateur dans le taux d’avancement global est également expliquée.
        </p>
        {
          indicateurDétailsParTerritoires !== null &&
            <Tableau<IndicateurDétailsParTerritoire>
              afficherLaRecherche={false}
              colonnes={colonnes}
              données={indicateurDétailsParTerritoires}
              entité='indicateur'
            />
        }
        <IndicateurDétails indicateur={indicateur} />
      </Bloc>
    </IndicateurBlocStyled>
  );
}
