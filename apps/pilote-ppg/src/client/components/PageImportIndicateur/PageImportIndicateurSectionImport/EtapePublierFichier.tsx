import { Dispatch, FunctionComponent, SetStateAction } from "react";
import Link from "next/link";
import { RapportContrat } from "@/server/app/contrats/RapportContrat";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { wording } from "@/client/utils/i18n/i18n";
import FormulairePublierImportIndicateur from "@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireImportIndicateur/FormulairePublierImportIndicateur";
import { usePublierIndicateur } from "@/hooks/usePublierIndicateur";
import { Table } from "@/components/shared/Table";

const EtapePublierFichier: FunctionComponent<{
  estFichierPublie: boolean;
  indicateurId: string;
  chantierId: string;
  rapportId: string;
  setEstFichierPublie: Dispatch<SetStateAction<boolean>>;
  rapportImport: RapportContrat | null;
}> = ({
  estFichierPublie,
  indicateurId,
  chantierId,
  rapportId,
  setEstFichierPublie,
  rapportImport,
}) => {
  const { publierLeFichier, isPending } = usePublierIndicateur(
    chantierId,
    indicateurId,
    rapportId,
    setEstFichierPublie,
  );
  return (
    <div>
      {estFichierPublie ? (
        <div className="fr-mt-4w">
          <Alerte
            message={
              wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                .ETAPE_PUBLIER_FICHIER.MESSAGE_ALERT_SUCCES
            }
            titre={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TITRE_ALERT_SUCCES(
              indicateurId,
            )}
            type="succès"
          />
          <div className="fr-mt-3w flex justify-end">
            <Link
              className="fr-btn ml-8"
              href={`/chantier/${chantierId}/indicateurs`}
              title="Importer de nouvelles données"
            >
              <span>
                {
                  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                    .ETAPE_PUBLIER_FICHIER.MESSAGE_BOUTON_RETOUR
                }
              </span>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {rapportImport?.listeMesuresIndicateurTemporaire.length ? (
            <>
              <FormulairePublierImportIndicateur
                isPending={isPending}
                publierLeFichier={publierLeFichier}
              />
              <Table.Root
                caption="Prévisualisation des données à publier"
                captionHidden
                className="w-full"
                containerClassName="my-6 p-0"
              >
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>
                      {
                        wording.PAGE_IMPORT_MESURE_INDICATEUR
                          .SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER
                          .TABLEAU_PREVISUALISATION.ENTETE.IDENTIFIANT_INDIC
                      }
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {
                        wording.PAGE_IMPORT_MESURE_INDICATEUR
                          .SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER
                          .TABLEAU_PREVISUALISATION.ENTETE.ZONE_ID
                      }
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {
                        wording.PAGE_IMPORT_MESURE_INDICATEUR
                          .SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER
                          .TABLEAU_PREVISUALISATION.ENTETE.DATE_VALEUR
                      }
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {
                        wording.PAGE_IMPORT_MESURE_INDICATEUR
                          .SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER
                          .TABLEAU_PREVISUALISATION.ENTETE.TYPE_VALEUR
                      }
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      {
                        wording.PAGE_IMPORT_MESURE_INDICATEUR
                          .SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER
                          .TABLEAU_PREVISUALISATION.ENTETE.VALEUR
                      }
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {rapportImport?.listeMesuresIndicateurTemporaire.map(
                    (mesureIndicateurTemporaire) => {
                      return (
                        <Table.Row
                          key={`${mesureIndicateurTemporaire.metricType}-${mesureIndicateurTemporaire.zoneId}`}
                        >
                          <Table.Cell>
                            {mesureIndicateurTemporaire.indicId}
                          </Table.Cell>
                          <Table.Cell>
                            {mesureIndicateurTemporaire.zoneId}
                          </Table.Cell>
                          <Table.Cell>
                            {mesureIndicateurTemporaire.metricDate}
                          </Table.Cell>
                          <Table.Cell>
                            {mesureIndicateurTemporaire.metricType}
                          </Table.Cell>
                          <Table.Cell>
                            {mesureIndicateurTemporaire.metricValue}
                          </Table.Cell>
                        </Table.Row>
                      );
                    },
                  )}
                </Table.Body>
              </Table.Root>
              <FormulairePublierImportIndicateur
                isPending={isPending}
                publierLeFichier={publierLeFichier}
              />
            </>
          ) : (
            <Alerte
              titre={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_PUBLIER_FICHIER.TITRE_ALERT_ERREUR
              }
              type="erreur"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EtapePublierFichier;
