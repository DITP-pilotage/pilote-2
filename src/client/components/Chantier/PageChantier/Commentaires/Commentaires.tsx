import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Commentaires() {
  return (
    <section
      className='fr-pb-5w'
    >
      <Titre
        baliseHtml='h2'
        id="commentaires"
      >
        Commentaires du chantier (maille nationale)
      </Titre>
      <CarteSquelette>
        <div className='fr-p-2w carteEnTête'>
          France
        </div>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </CarteSquelette>
    </section>
  );
}
