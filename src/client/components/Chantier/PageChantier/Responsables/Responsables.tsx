import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Responsables() {
  return (
    <div
      className='fr-pb-10w'
      id="responsables"
    >
      <Titre baliseHtml='h3'>
        Responsables
      </Titre>
      <CarteSquelette>
        <p className='fr-grid-row fr-grid-row--center'>
          A venir...
        </p>
      </CarteSquelette>
    </div>
  );
}
