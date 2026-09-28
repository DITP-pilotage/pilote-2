import { FunctionComponent } from "react";
import { wording } from "@/client/utils/i18n/i18n";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";
import { Table } from "@/components/shared/Table";

interface ResultatValidationFichierProps {
  rapport: DetailValidationFichierContrat;
}

const ResultatValidationFichier: FunctionComponent<
  ResultatValidationFichierProps
> = ({ rapport }) => {
  const contientDesErreursNonIdentifies = rapport.listeErreursValidation.some(
    (erreur) => erreur.nom === "Erreur non identifié",
  );

  return (
    <section className="fr-my-2w">
      {rapport.estValide ? (
        <Alerte
          message={
            wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
              .ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_SUCCES
          }
          titre={
            wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
              .ETAPE_CHARGER_FICHIER.TITRE_ALERT_SUCCES
          }
          type="succès"
        />
      ) : (
        <div>
          {contientDesErreursNonIdentifies ? (
            <Alerte
              message={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_ERREUR_SUPPORT
              }
              titre={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR_SUPPORT
              }
              type="erreur"
            />
          ) : (
            <Alerte
              message={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.MESSAGE_ALERT_ERREUR
              }
              titre={
                wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                  .ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR
              }
              type="erreur"
            />
          )}
          <h5 className="fr-mt-3w">
            Rapport d'erreur de la validation du fichier
          </h5>
          <Table.Root
            caption="Rapport d'erreur de la validation du fichier"
            captionHidden
            containerClassName="m-0 p-0"
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.NOM
                  }
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.CELLULE
                  }
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.MESSAGE
                  }
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE.NOM_DU_CHAMP
                  }
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  {
                    wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                      .ETAPE_CHARGER_FICHIER.TABLEAU_ERREUR.ENTETE
                      .POSITION_DE_LIGNE
                  }
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rapport.listeErreursValidation.map((erreur) => {
                return (
                  <Table.Row
                    key={`${erreur.cellule}-${erreur.numeroDeLigne}-${erreur.positionDeLigne}`}
                  >
                    <Table.Cell>{erreur.nom}</Table.Cell>
                    <Table.Cell>{erreur.cellule}</Table.Cell>
                    <Table.Cell>{erreur.message}</Table.Cell>
                    <Table.Cell>{erreur.nomDuChamp}</Table.Cell>
                    <Table.Cell>{erreur.positionDeLigne}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </div>
      )}
    </section>
  );
};

export default ResultatValidationFichier;
