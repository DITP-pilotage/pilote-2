import Title from 'client/components/_commons/Title/Title';
import ListeChantiers from '../ListeChantiers/ListeChantiers';
import PageChantiersProps from './PageChantiers.interface';

export default function PageChantiers({ chantiers }: PageChantiersProps) {
  return (
    <div className="fr-container">
      <Title
        as='h1'
        look="fr-hidden"
      >
        Page des chantiers
      </Title>
      <div className="fr-grid-row">
        <Title as='h2'> 
          62 chantiers dans les résultats
        </Title>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col">
          Carte
        </div>
        <div className="fr-col">
          <div className="fr-grid-row">
            <Title as='h3'>
              Taux d’avancement moyen de la sélection
            </Title>
            <div className="fr-col">
              barre annuel
            </div>      
            <div className="fr-col">
              barre global
            </div>
          </div>
          <div className="fr-grid-row">
            <Title as='h3'>
              Répartition des taux d’avancement de la sélection
            </Title>
            <div>
              bloques
            </div>
          </div>
          <div className="fr-grid-row">
            <Title as='h3'>
              Répartition des météos de la sélection
            </Title>
            <div>
              Bloques
            </div>
          </div>
        </div>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col">
          <ListeChantiers chantiers={chantiers} />
        </div>
      </div>
    </div>
  );
}