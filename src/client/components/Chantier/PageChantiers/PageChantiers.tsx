import Title from 'client/components/_commons/Title/Title';
import ListeChantiers from './ListeChantiers';

export default function PageChantiers() {
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col">
          <Title as='h1'>
            Page des chantiers
          </Title>
          <ListeChantiers />
        </div>
      </div>
    </div>
  );
}