import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function SynthèseRésultats() {
  return (
    <div
      className='fr-pb-10w'
      id="synthèse"
    >
      <Titre baliseHtml='h2'>
        Synthèse des résultats
      </Titre>
      <p>
        Explications sur la pondération des indicateurs (à rédiger).
      </p>
      <CarteSquelette>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </CarteSquelette>
    </div>
  );
}
