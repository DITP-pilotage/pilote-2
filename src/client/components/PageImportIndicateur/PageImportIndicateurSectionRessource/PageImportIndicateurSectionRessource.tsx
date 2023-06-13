import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import PageImportIndicateurSectionRessourceStyled
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionRessource/PageImportIndicateurSectionRessource.styled';
import { wording } from '@/client/utils/i18n/i18n';
import '@gouvfr/dsfr/dist/component/download/download.min.css';


export function PageImportIndicateurSectionRessource() {
  return (
    <PageImportIndicateurSectionRessourceStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.TITRE}
        </Titre>
        <Bloc>
          <Titre baliseHtml='h3'>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TITRE}
          </Titre>
          <p>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.SOUS_TITRE}
          </p>
          <ul>
            <li>
              <b>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.IDENTIFIANT_INDIC.CHAMP}
              </b>
              <span>
                {` • ${wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.IDENTIFIANT_INDIC.EXPLICATION}`}
              </span>
            </li>
            <li>
              <b>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.ZONE_ID.CHAMP}
              </b>
              <span>
                {` • ${wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.ZONE_ID.EXPLICATION}`}
              </span>
            </li>
            <li>
              <b>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.ZONE.CHAMP}
              </b>
              <span>
                {` • ${wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.ZONE.EXPLICATION}`}
              </span>
            </li>
            <li>
              <b>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.DATE_VALEUR.CHAMP}
              </b>
              <span>
                {` • ${wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.DATE_VALEUR.EXPLICATION}`}
              </span>
            </li>
            <li>
              <b>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.TYPE_VALEUR.CHAMP}
              </b>
              <span>
                {` • ${wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.TYPE_VALEUR.EXPLICATION}`}
              </span>
            </li>
            <li>
              <b>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.VALEUR.CHAMP}
              </b>
              <span>
                {` • ${wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.LISTE_CHAMPS.VALEUR.EXPLICATION}`}
              </span>
            </li>
          </ul>
          <p>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.FORMAT_ACCEPTE}
          </p>
          <table className='fr-table fr-mb-3 fr-p-0'>
            <thead>
              <tr>
                <th>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.ENTETE.IDENTIFIANT_INDIC}
                </th>
                <th>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.ENTETE.ZONE_ID}
                </th>
                <th>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.ENTETE.ZONE}
                </th>
                <th>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.ENTETE.DATE_VALEUR}
                </th>
                <th>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.ENTETE.TYPE_VALEUR}
                </th>
                <th>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.ENTETE.VALEUR}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_1.IDENTIFIANT_INDIC}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_1.ZONE_ID}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_1.ZONE}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_1.DATE_VALEUR}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_1.TYPE_VALEUR}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_1.VALEUR}
                </td>
              </tr>
              <tr>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_2.IDENTIFIANT_INDIC}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_2.ZONE_ID}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_2.ZONE}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_2.DATE_VALEUR}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_2.TYPE_VALEUR}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_2.VALEUR}
                </td>
              </tr>
              <tr>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_3.IDENTIFIANT_INDIC}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_3.ZONE_ID}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_3.ZONE}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_3.DATE_VALEUR}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_3.TYPE_VALEUR}
                </td>
                <td>
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_IMPORT.TABLEAU_CHAMPS.LIGNE_EXEMPLE_3.VALEUR}
                </td>
              </tr>
            </tbody>
          </table>
          <Titre baliseHtml='h3'>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_REFERENTIEL.TITRE}
          </Titre>
          <p>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_REFERENTIEL.SOUS_TITRE}
          </p>
          <div className="flex">
            <div className="fr-download fr-mr-3w fr-hidden">
              <p>
                <a
                  className="fr-download__link"
                  download
                  href="/referentiel/referentiel_territoires.xlsx"
                >
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_REFERENTIEL.LABEL_BOUTON_TELECHARGER_REFERENTIEL_INDICATEUR}
                  <span className="fr-download__detail">
                    {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_REFERENTIEL.FORMAT_BOUTON_TELECHARGER_REFERENTIEL_INDICATEUR}
                  </span>
                </a>
              </p>
            </div>
            <div className="fr-download">
              <p>
                <a
                  className="fr-download__link"
                  download
                  href="/referentiel/referentiel_territoires.xlsx"
                >
                  {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_REFERENTIEL.LABEL_BOUTON_TELECHARGER_REFERENTIEL_TERRITOIRE}
                  <span className="fr-download__detail">
                    {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_REFERENTIEL.FORMAT_BOUTON_TELECHARGER_REFERENTIEL_TERRITOIRE}
                  </span>
                </a>
              </p>
            </div>
          </div>
          <Titre baliseHtml='h3'>
            {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.TITRE}
          </Titre>
          <ul>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_1}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_2}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_3}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_4}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_5}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_6}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_7}
            </li>
            <li>
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_RESSOURCE.SECTION_EXPLICATION_FICHIER.EXPLICATION_FICHIER_8}
            </li>
          </ul>
        </Bloc>
      </div>
    </PageImportIndicateurSectionRessourceStyled>
  );
}
