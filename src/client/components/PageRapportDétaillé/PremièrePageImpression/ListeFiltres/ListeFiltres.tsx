import ListeFiltresProps from '@/components/PageRapportDétaillé/PremièrePageImpression/ListeFiltres/ListeFiltres.interface';

export function ListeFiltres({ nom, enfants }: ListeFiltresProps) {
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
}
