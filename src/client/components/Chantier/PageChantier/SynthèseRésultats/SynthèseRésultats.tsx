import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function SynthèseRésultats() {
  return (
    <section>
      <Titre
        baliseHtml='h2'
        id="synthèse"
      >
        Synthèse des résultats
      </Titre>
      <CarteSquelette>
        <div className='fr-p-2w carteEnTête'>
          National
        </div>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </CarteSquelette>
    </section>
  );
}
