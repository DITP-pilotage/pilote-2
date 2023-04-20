import { ResultatValidationFichierProps } from './ResultatValidationFichier.interface';

export default function ResultatValidationFichier({ rapport }: ResultatValidationFichierProps) {
  return (
    <section>
      {
      rapport.estValide
        ?
          <p>
            Le fichier est valide
          </p>
        :
          <div className='fr-py-4w'>
            <h5>
              Rapport d&apos;erreur de la validation du fichier
            </h5>
            <table className='fr-table fr-m-0 fr-p-0'>
              <thead>
                <tr>
                  <th>
                    Nom
                  </th>
                  <th>
                    Cellule
                  </th>
                  <th>
                    Message
                  </th>
                  <th>
                    Nom du champ
                  </th>
                  <th>
                    Numéro de ligne
                  </th>
                  <th>
                    Position de ligne
                  </th>
                  <th>
                    Position du champ
                  </th>
                </tr>
              </thead>
              <tbody>
                {
            rapport.listeErreursValidation.map(erreur => {
              return (
                <tr key={`${erreur.cellule}-${erreur.numeroDeLigne}-${erreur.positionDeLigne}`}>
                  <td>
                    {erreur.nom}
                  </td>
                  <td>
                    {erreur.cellule}
                  </td>
                  <td>
                    {erreur.message}
                  </td>
                  <td>
                    {erreur.nomDuChamp}
                  </td>
                  <td>
                    {erreur.numeroDeLigne}
                  </td>
                  <td>
                    {erreur.positionDeLigne}
                  </td>
                  <td>
                    {erreur.positionDuChamp}
                  </td>
                </tr>
              );
            })
            }
              </tbody>
            </table>
          </div>
      }
    </section>
  );
}
