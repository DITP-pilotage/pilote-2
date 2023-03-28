import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

export default function ResultatValidationFichier({ rapport } : { rapport: DetailValidationFichierContrat }) {
  return (
    <section>
      {
      rapport.estValide
        ?
          <p>
            Le fichier est valide
          </p>
        :
          <table>
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
      }
    </section>
  );
}
