import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function SynthèseRésultats() {
  return (
    <div id="synthèse">
      <Titre baliseHtml='h2'>
        Synthèse des résultats
      </Titre>
      <CarteSquelette>
        <header className='fr-p-2w'>
          National
        </header>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </CarteSquelette>
    </div>
  );
}
