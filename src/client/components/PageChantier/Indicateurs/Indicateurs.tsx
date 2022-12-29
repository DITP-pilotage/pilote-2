import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps, {
  ÉlémentPageIndicateursType,
} from '@/components/PageChantier/Indicateurs/Indicateurs.interface';
import CarteIndicateur from '@/components/PageChantier/Indicateurs/CarteIndicateur/CarteIndicateur';
import Type, { valeursType } from '@/server/domain/indicateur/Type.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Bloc from '@/components/_commons/Bloc/Bloc';

export const listeRubriquesIndicateurs: ÉlémentPageIndicateursType[] = [
  { nom: 'Indicateurs de contexte', ancre: 'contexte', typeIndicateur: 'CONTEXTE' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement', typeIndicateur: 'DÉPLOIEMENT' },
  { nom: 'Indicateurs d\'impact', ancre: 'impact', typeIndicateur: 'IMPACT' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception', typeIndicateur: 'QUALITÉ_DE_SERVICE' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi', typeIndicateur: 'SUIVI_EXTERNALITÉS_ET_EFFET_REBOND' },
];

export default function Indicateurs({ indicateurs }: IndicateursProps) {
  const indicateursGroupésParType: Record<NonNullable<Type>, Indicateur[]> = Object.fromEntries(valeursType.map(( type) =>
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
      { listeRubriquesIndicateurs.map(rubrique => (

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
                  <p>
                    Aucun indicateur
                  </p>
                </Bloc>
              )
              : (
                indicateursGroupésParType[rubrique.typeIndicateur].map(indicateur => (
                  <CarteIndicateur
                    indicateur={indicateur}
                    key={indicateur.id}
                  />
                ))
              )
          }
        </div>
      ))}
    </div>
  );
}
