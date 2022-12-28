import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/Chantier/PageChantier/Indicateurs/Indicateurs.interface';
import CarteIndicateur from '@/components/Chantier/PageChantier/Indicateurs/CarteIndicateur/CarteIndicateur';
import Type, { valeursType } from '@/server/domain/indicateur/Type.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';

export default function Indicateurs({ listeRubriquesIndicateurs, indicateurs }: IndicateursProps) {

  let indicateursRubriques :Record<NonNullable<Type>, Indicateur[]> = Object.fromEntries(valeursType.map(( type) =>
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
      { listeRubriquesIndicateurs.map(rubriqueIndicateurs => (

        <div
          className='fr-mb-4w'
          id={rubriqueIndicateurs.ancre}
          key={rubriqueIndicateurs.ancre}
        >
          <Titre
            baliseHtml='h3'
            className='fr-h4'
          >
            {rubriqueIndicateurs.nom}
          </Titre>
          {
            rubriqueIndicateurs.typeIndicateur !== null
              &&
              indicateursRubriques[rubriqueIndicateurs.typeIndicateur].length > 0
              ?
              indicateursRubriques[rubriqueIndicateurs.typeIndicateur]
                .map(indicateur => (
                  <CarteIndicateur
                    indicateur={indicateur}
                    key={indicateur.id}
                  />
                ))
              :
              <CarteSquelette>
                <p>
                  Aucun indicateur
                </p>
              </CarteSquelette>
          }
        </div>
      ))}
    </div>
  );
}
