import { FunctionComponent } from 'react';

interface ListeFiltresProps {
  nom: string,
  enfants: ListeFiltresProps[],
}
  
const ListeFiltres: FunctionComponent<ListeFiltresProps> = ({ nom, enfants }) => {
  return (
    <li>
      {nom}
      <ul>
        {
          enfants.map(enfant => (
            <ListeFiltres
              enfants={enfant.enfants}
              key={enfant.nom}
              nom={enfant.nom}
            />
          ))
        }
      </ul>
    </li>
  );
};

export default ListeFiltres;
