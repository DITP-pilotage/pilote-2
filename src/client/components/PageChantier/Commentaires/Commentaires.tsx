import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';

export default function Commentaires() {
  return (
    <div
      className='fr-pb-5w'
      id="commentaires"
    >
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Commentaires du chantier (maille nationale)
      </Titre>
      <Bloc titre='France'>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </Bloc>
    </div>
  );
}
