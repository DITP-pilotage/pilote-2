import TableauProps from './Tableau.interface';

export default function Tableau({ colonnes, donnees, resume }: TableauProps) {
  const renderHeader = () => (
    <thead>
      <tr key="headers">
        {colonnes.map((colonne) => (
          <th
            // className={classNames({ sortable: colonne.sortable })}
            key={colonne.nom}
            // onClick={() => {
            //   if (colonne.sortable) {
            //     manageSort(colonne);
            //   }
            // }}
            scope="col"
          >
            <div className="table-colonne-header">
              {colonne.label}
              {/* {colonne.sortable ? getSortIcon(colonne) : null} */}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
    
  return (
    <div className="fr-table fr-table--bordered">
      <table>
        {
          resume ?
            <caption>
              {resume}
            </caption>
            : ''
        }
        {renderHeader()}
        <tbody>
          {
              donnees.map((ligne) => (
                <tr key={ligne.id}>
                  {
                    colonnes.map((colonne) => (
                      <td key={colonne.nom}>
                        {colonne.render ? colonne.render(ligne) : ligne[colonne.nom]}
                      </td>
                    ))
                  }
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  );
}