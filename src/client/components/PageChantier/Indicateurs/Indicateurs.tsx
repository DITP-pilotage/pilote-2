import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps, { ÉlémentPageIndicateursType } from '@/components/PageChantier/Indicateurs/Indicateurs.interface';
import IndicateurBloc from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc';

export const listeRubriquesIndicateurs: ÉlémentPageIndicateursType[] = [
  { nom: 'Indicateurs d\'impact', ancre: 'impact', typeIndicateur: 'IMPACT' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement', typeIndicateur: 'DEPL' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception', typeIndicateur: 'Q_SERV' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi', typeIndicateur: 'REBOND' },
  { nom: 'Indicateurs de contexte', ancre: 'contexte', typeIndicateur: 'CONTEXTE' },
];

export default function Indicateurs({ indicateurs, détailsIndicateurs, estDisponibleALImport = false, estInteractif = true }: IndicateursProps) {

  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <>
      {
        listeRubriquesIndicateurs.map((rubriqueIndicateur, i) => {
          const indicateursDeCetteRubrique = indicateurs.filter(ind => ind.type === rubriqueIndicateur.typeIndicateur);

          if (indicateursDeCetteRubrique.length > 0) {
            return (
              <section
                className={i < listeRubriquesIndicateurs.length - 1 ? 'fr-mb-3w' : ''}
                id={rubriqueIndicateur.ancre}
                key={rubriqueIndicateur.ancre}
              >
                <Titre
                  baliseHtml='h3'
                  className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
                >
                  {rubriqueIndicateur.nom}
                </Titre>
                {
                  indicateursDeCetteRubrique.map(indicateur => (
                    <IndicateurBloc
                      détailsIndicateur={détailsIndicateurs[indicateur.id]}
                      estDisponibleALImport={estDisponibleALImport}
                      estInteractif={estInteractif}
                      indicateur={indicateur}
                      key={indicateur.id}
                    />
                  ))
                }
              </section>
            );
          }
        })
      }
    </>
  );
}
