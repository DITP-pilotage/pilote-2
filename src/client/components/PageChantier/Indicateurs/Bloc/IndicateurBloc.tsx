import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/PageChantier/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, { IndicateurDétailsParTerritoire } from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc.interface';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurs from './useIndicateurBloc';

export default function IndicateurBloc({ indicateur, détailsIndicateur } : IndicateurBlocProps) {
  const { indicateurDétailsParTerritoires, colonnes } = useIndicateurs(détailsIndicateur);

  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <section>
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
          <p className='fr-mb-2w information-secondaire texte-gris'>
            Dernière mise à jour : Non renseigné
          </p>
          <Tableau<IndicateurDétailsParTerritoire>
            afficherLaRecherche={false}
            colonnes={colonnes}
            données={indicateurDétailsParTerritoires}
            entité='indicateur'
          />
          <IndicateurDétails
            indicateur={indicateur}
            indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
          />
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
}
