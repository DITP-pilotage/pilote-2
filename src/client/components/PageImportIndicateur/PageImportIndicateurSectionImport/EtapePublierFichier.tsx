import { FunctionComponent } from "react";
import { RapportContrat } from "@/server/app/contrats/RapportContrat";
import { wording } from "@/client/utils/i18n/i18n";
import FormulairePublierImportIndicateur from "@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireImportIndicateur/FormulairePublierImportIndicateur";

const EtapePublierFichier: FunctionComponent<{
  indicateurId: string;
  chantierId: string;
  rapportId: string;
  rapportImport: RapportContrat | null;
}> = ({ indicateurId, chantierId, rapportId, rapportImport }) => {
  return (
    <div>
      {rapportImport?.listeMesuresIndicateurTemporaire.length ? (
        <>
          <FormulairePublierImportIndicateur
            chantierId={chantierId}
            indicateurId={indicateurId}
            rapportId={rapportId}
          />
          <table className="fr-table fr-my-3w fr-p-0">
            <thead>
              <tr>
                <th>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE
                      .IDENTIFIANT_INDIC
                  }
                </th>
                <th>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE
                      .ZONE_ID
                  }
                </th>
                <th>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE
                      .DATE_VALEUR
                  }
                </th>
                <th>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE
                      .TYPE_VALEUR
                  }
                </th>
                <th>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_PUBLIER_FICHIER.TABLEAU_PREVISUALISATION.ENTETE
                      .VALEUR
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              {rapportImport?.listeMesuresIndicateurTemporaire.map(
                (mesureIndicateurTemporaire) => {
                  return (
                    <tr
                      key={`${mesureIndicateurTemporaire.metricType}-${mesureIndicateurTemporaire.zoneId}`}
                    >
                      <td>{mesureIndicateurTemporaire.indicId}</td>
                      <td>{mesureIndicateurTemporaire.zoneId}</td>
                      <td>{mesureIndicateurTemporaire.metricDate}</td>
                      <td>{mesureIndicateurTemporaire.metricType}</td>
                      <td>{mesureIndicateurTemporaire.metricValue}</td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
          <FormulairePublierImportIndicateur
            chantierId={chantierId}
            indicateurId={indicateurId}
            rapportId={rapportId}
          />
        </>
      ) : null}
    </div>
  );
};

export default EtapePublierFichier;
