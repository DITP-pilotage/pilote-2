import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import EnTête from '@/components/_commons/Bloc/EnTête/EnTête';

export default function Commentaires() {
  return (
    <div
      className='fr-pb-5w'
      id="commentaires"
    >
      <Titre baliseHtml='h2'>
        Commentaires du chantier (maille nationale)
      </Titre>
      <Bloc>
        <EnTête libellé='France' />
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </Bloc>
    </div>
  );
}
