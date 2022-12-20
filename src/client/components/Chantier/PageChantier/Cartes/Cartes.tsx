import CarteSquelette from '@/components/_commons/CarteSquelette/CarteSquelette';
import Titre from '@/components/_commons/Titre/Titre';

export default function Cartes() {
  return (
    <div 
      className='fr-pb-5w'
      id="cartes"
    >
      <Titre baliseHtml='h2'>
        Cartes
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
        <div className="fr-col-12 fr-col-xl-6">
          <CarteSquelette>
            <Titre
              apparence='fr-text--lg'
              baliseHtml='h4'
            >
              Répartition géographique du taux d’avancement du chantier
            </Titre>
            <p className='fr-grid-row fr-grid-row--center'>
              A venir...
            </p>
          </CarteSquelette>
        </div>
        <div className="fr-col-12 fr-col-xl-6">
          <CarteSquelette>
            <Titre
              apparence='fr-text--lg'
              baliseHtml='h4'
            >
              Répartition géographique du niveau de confiance
            </Titre>
            <p className='fr-grid-row fr-grid-row--center'>
              A venir...
            </p>
          </CarteSquelette>
        </div>
      </div>
    </div>
  );
}
