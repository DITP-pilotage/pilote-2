import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Indicateurs({ indicateurs }: { indicateurs: { nom: string, ancre: string }[] }) {
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
      { indicateurs.map(indicateur => (
        <div
          className='fr-mb-4w'
          id={indicateur.ancre}
          key={indicateur.ancre}
        >
          <Titre
            apparence='fr-h4'
            baliseHtml='h3'
          >
            {indicateur.nom}
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
