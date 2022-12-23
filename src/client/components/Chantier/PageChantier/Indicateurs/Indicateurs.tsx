import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/Chantier/PageChantier/Indicateurs/Indicateurs.interface';

export default function Indicateurs({ listeRubriquesIndicateurs }: IndicateursProps) {
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
            apparence='fr-h4'
            baliseHtml='h3'
          >
            {rubriqueIndicateurs.nom}
          </Titre>
          <CarteSquelette>
            <p className='fr-grid-row fr-grid-row--center'>
              A venir...
            </p>
          </CarteSquelette>
        </div>
      ))}
    </div>
  );
}
