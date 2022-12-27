import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

const indicateurs = [
  { nom: 'Indicateurs de contexte', ancre: 'contexte' },
  { nom: 'Indicateurs de déploiement', ancre: 'déploiement' },
  { nom: 'Indicateurs d\'impact', ancre: 'impact' },
  { nom: 'Indicateurs de qualité de service', ancre: 'perception' },
  { nom: 'Indicateurs de suivi des externalités et effets rebond', ancre: 'suivi' },
];

export default function Indicateurs() {
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
            baliseHtml='h3'
            id={indicateur.ancre}
          >
            {indicateur.nom}
          </Titre>
          <CarteSquelette>
            <p
              className='fr-grid-row fr-grid-row--center'
            >
              A venir...
            </p>
          </CarteSquelette>
        </section>
      ))}
    </section>
  );
}
