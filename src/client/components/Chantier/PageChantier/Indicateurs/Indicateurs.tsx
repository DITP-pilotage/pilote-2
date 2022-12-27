import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Indicateurs({ indicateurs }: { indicateurs: { nom: string, ancre: string }[] }) {
  return (
    <section
      className='fr-pb-5w'

    >
      <Titre
        baliseHtml='h2'
        id="indicateurs"
      >
        Indicateurs
      </Titre>
      <p>
        Explications sur la pondération des indicateurs (à rédiger).
      </p>
      { indicateurs.map(indicateur => (
        <section
          className='fr-mb-4w'
          key={indicateur.ancre}
        >
          <Titre
            apparence='fr-h4'
            baliseHtml='h2'
            id={indicateur.ancre}
          >
            {indicateur.nom}
          </Titre>
          <CarteSquelette>
            <p
              className='fr-grid-row fr-grid-row--center'
              style={{ height: '300px' }}
            >
              A venir...
            </p>
          </CarteSquelette>
        </section>
      ))}
    </section>
  );
}
