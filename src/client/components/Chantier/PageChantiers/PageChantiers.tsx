import Title from 'client/components/_commons/Title/Title';
import ListeChantiers from '../ListeChantiers/ListeChantiers';
import PageChantiersProps from './PageChantiers.interface';

export default function PageChantiers({ chantiers }: PageChantiersProps) {
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col">
          <Title as='h1'>
            Page des chantiers
          </Title>
          <ListeChantiers chantiers={chantiers} />
        </div>
      </div>
    </div>
  );
}