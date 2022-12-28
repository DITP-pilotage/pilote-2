import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';

export default function SynthèseRésultats() {
  return (
    <div id="synthèse">
      <Titre baliseHtml='h2'>
        Synthèse des résultats
      </Titre>
      <Bloc>
        <div className='fr-p-2w carteEnTête'>
          National
        </div>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </Bloc>
    </div>
  );
}
