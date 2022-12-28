import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import EnTête from '@/components/_commons/Bloc/EnTête/EnTête';

export default function SynthèseRésultats() {
  return (
    <div id="synthèse">
      <Titre baliseHtml='h2'>
        Synthèse des résultats
      </Titre>
      <Bloc>
        <EnTête libellé='National' />
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </Bloc>
    </div>
  );
}
