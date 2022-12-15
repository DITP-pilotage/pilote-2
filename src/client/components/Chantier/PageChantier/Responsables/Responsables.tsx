import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Responsables() {
  return (
    <div id="responsables">
      <Titre baliseHtml='h2'>
        Responsables
      </Titre>
      <CarteSquelette>
        <header className='fr-p-2w fr-mb-2w'>
          National
        </header>
        <div className='fr-pl-2w fr-grid-row'>
          <p className='fr-text--sm fr-text--bold fr-col'>
            Ministère porteur
          </p>
          <p className='fr-text--sm fr-col'>
            Non renseigné
          </p>
        </div>
        <hr className='fr-hr' />
        <div className='fr-pl-2w fr-grid-row'>
          <p className='fr-text--sm fr-text--bold fr-col'>
            Autres ministères co-porteurs
          </p>
          <p className='fr-text--sm fr-col'>
            Non renseigné
          </p>
        </div>
        <hr className='fr-hr' />
        <div className='fr-pl-2w fr-grid-row'>
          <p className='fr-text--sm fr-text--bold fr-col'>
            Directeur d’Administration Centrale
          </p>
          <p className='fr-text--sm fr-col'>
            Non renseigné
          </p>
        </div>
        <hr className='fr-hr' />
        <div className='fr-pl-2w fr-grid-row'>
          <p className='fr-text--sm fr-text--bold fr-col'>
            Nom du Directeur de Projet
          </p>
          <p className='fr-text--sm fr-col'>
            Non renseigné
          </p>
        </div>
        <hr className='fr-hr' />
      </CarteSquelette>
    </div>
  );
}
