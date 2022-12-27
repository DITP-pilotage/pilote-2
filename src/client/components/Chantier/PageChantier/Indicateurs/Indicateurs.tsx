import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/Chantier/PageChantier/Indicateurs/Indicateurs.interface';
import CarteIndicateur from '@/components/Chantier/PageChantier/Indicateurs/CarteIndicateur/CarteIndicateur';

export default function Indicateurs({ listeRubriquesIndicateurs, indicateurs }: IndicateursProps) {
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
           indicateurs
             .filter(indicateur => indicateur.type === rubriqueIndicateurs.typeIndicateur)
             .map(indicateur => (
               <CarteIndicateur
                 indicateur={indicateur}
                 key={indicateur.id}
               />
             ))
          }
        </div>
      ))}
    </div>
  );
}
