import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps, { ÉlémentPageIndicateursType } from '@/components/PageChantier/Indicateurs/Indicateurs.interface';
import IndicateurBloc from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc';
import Indicateur, { TypeIndicateur, typesIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import Bloc from '@/components/_commons/Bloc/Bloc';

export const listeRubriquesIndicateurs: ÉlémentPageIndicateursType[] = [
  { nom: 'Indicateurs d\'impact', ancre: 'impact', typeIndicateur: 'IMPACT' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement', typeIndicateur: 'DEPL' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception', typeIndicateur: 'Q_SERV' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi', typeIndicateur: 'REBOND' },
  { nom: 'Indicateurs de contexte', ancre: 'contexte', typeIndicateur: 'CONTEXTE' },
];

export default function Indicateurs({ indicateurs }: IndicateursProps) {
  const indicateursGroupésParType: Record<NonNullable<TypeIndicateur>, Indicateur[]> = Object.fromEntries(typesIndicateur.map(type =>
    [type, indicateurs.filter(indicateur => indicateur.type === type)],
  ));

  return (
    <div
      className='fr-pb-5w'
      id="indicateurs"
    >
      <Titre baliseHtml='h2'>
        Indicateurs
      </Titre>
      <p>
        Explications sur la pondération des indicateurs (à rédiger).
      </p>
      { 
        listeRubriquesIndicateurs.map(rubrique => (
          <div
            className='fr-mb-4w'
            id={rubrique.ancre}
            key={rubrique.ancre}
          >
            <Titre
              baliseHtml='h3'
              className='fr-h4'
            >
              {rubrique.nom}
            </Titre>
            {
              indicateursGroupésParType[rubrique.typeIndicateur].length === 0
                ? (
                  <Bloc>
                    <p className="fr-m-0">
                      Aucun indicateur
                    </p>
                  </Bloc>
                )
                : (
                  indicateursGroupésParType[rubrique.typeIndicateur].map(indicateur => (
                    <IndicateurBloc
                      indicateur={indicateur}
                      key={indicateur.id}
                    />
                  ))
                )
            }
          </div>
        ))
}
    </div>
  );
}
