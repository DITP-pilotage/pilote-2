import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Indicateurs() {
  return (
    <div
      className='fr-pb-10w'
      id="indicateurs"
    >
      <Titre baliseHtml='h2'>
        Indicateurs
      </Titre>
      <p>
        Explications sur la pondération des indicateurs (à rédiger).
      </p>
      <div
        className='fr-mb-4w'
        id='contexte'
      >
        <Titre baliseHtml='h4'>
          Indicateurs de contexte
        </Titre>
        <CarteSquelette>
          <p className='fr-grid-row fr-grid-row--center'>
            A venir...
          </p>
        </CarteSquelette>
      </div>
      <div
        className='fr-mb-4w'
        id='déploiement'
      >
        <Titre baliseHtml='h4'>
          Indicateurs de déploiement
        </Titre>
        <CarteSquelette>
          <p className='fr-grid-row fr-grid-row--center'>
            A venir...
          </p>
        </CarteSquelette>
      </div>
      <div
        className='fr-mb-4w'
        id='impact'
      >
        <Titre baliseHtml='h4'>
          Indicateurs  d&apos;impact
        </Titre>
        <CarteSquelette>
          <p className='fr-grid-row fr-grid-row--center'>
            A venir...
          </p>
        </CarteSquelette>
      </div>
      <div
        className='fr-mb-4w'
        id='perception'
      >
        <Titre baliseHtml='h4'>
          Indicateurs de perception et de qualité de service
        </Titre>
        <CarteSquelette>
          <p className='fr-grid-row fr-grid-row--center'>
            A venir...
          </p>
        </CarteSquelette>
      </div>
      <div
        className='fr-mb-4w'
        id='suivi'
      >
        <Titre baliseHtml='h4'>
          Indicateurs de suivi des externalités et effets rebond
        </Titre>
        <CarteSquelette>
          <p className='fr-grid-row fr-grid-row--center'>
            A venir...
          </p>
        </CarteSquelette>
      </div>
    </div>
  );
}
