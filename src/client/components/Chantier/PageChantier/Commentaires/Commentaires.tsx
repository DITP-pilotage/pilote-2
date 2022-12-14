import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Commentaires() {
  return (
    <div
      className='fr-pb-10w'
      id="commentaires"
    >
      <Titre baliseHtml='h2'>
        Commentaires du chantier (maille nationale)
      </Titre>
      <CarteSquelette>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </CarteSquelette>
    </div>
  );
}
