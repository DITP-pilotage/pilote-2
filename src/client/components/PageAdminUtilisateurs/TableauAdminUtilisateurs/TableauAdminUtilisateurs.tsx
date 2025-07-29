import "@gouvfr/dsfr/dist/component/table/table.min.css";
import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { useTableauPageAdminUtilisateurs } from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs";
import TableauEnTête from "@/components/_commons/TableauNew/EnTête/TableauEnTête";
import TableauPagination from "@/components/_commons/TableauNew/Pagination/TableauPagination";
import TableauAdminUtilisateursStyled from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs.styled";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Titre from "@/components/_commons/Titre/Titre";
import TableauAdminUtilisateursContenu from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";

const TableauAdminUtilisateurs: FunctionComponent<{
  listeUtilisateurs: UtilisateurListeGestionContrat[];
  nombreUtilisateur: number;
}> = ({ listeUtilisateurs, nombreUtilisateur }) => {
  const {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    setPagination,
  } = useTableauPageAdminUtilisateurs(listeUtilisateurs, nombreUtilisateur);

  const [typeCompte, setTypeCompte] = useQueryState(
    "typeCompte",
    parseAsString.withDefault("actif,desactive").withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
    }),
  );

  const modifierFiltre = (
    typeCompteAAfficher: ["actif", "desactive"] | ["actif"] | ["desactive"],
  ) => {
    setPagination({
      pageIndex: 1,
    });
    return setTypeCompte(typeCompteAAfficher.join(","));
  };

  const verifierTypeEstPresent = (regex: RegExp, typeExport: string) =>
    regex.test(typeExport);

  return (
    <TableauAdminUtilisateursStyled className="fr-px-1w">
      <div className="barre-de-recherche fr-mt-2w">
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
      </div>
      <Titre baliseHtml="h2" className="fr-h4 fr-mt-3w  fr-mb-0 titre-tableau">
        {`${nombreUtilisateur} ${nombreUtilisateur > 1 ? "comptes" : "compte"}`}
      </Titre>
      <div className="fr-mt-2w">
        <button
          className={`fr-tag fr-mr-1w ${verifierTypeEstPresent(/desactive/, typeCompte) && verifierTypeEstPresent(/actif/, typeCompte) ? "fr-tag-active" : ""}`}
          id="tag-comptes-tous"
          key="tag-comptes-tous"
          onClick={() => {
            modifierFiltre(["actif", "desactive"]);
          }}
          type="button"
        >
          Tous
        </button>
        <button
          className={`fr-tag fr-mr-1w ${verifierTypeEstPresent(/actif/, typeCompte) && !verifierTypeEstPresent(/desactive/, typeCompte) ? "fr-tag-active" : ""}`}
          id="tag-comptes-actifs"
          key="tag-comptes-actifs"
          onClick={() => {
            modifierFiltre(["actif"]);
          }}
          type="button"
        >
          Comptes actifs
        </button>
        <button
          className={`fr-tag fr-mr-1w ${verifierTypeEstPresent(/desactive/, typeCompte) && !verifierTypeEstPresent(/actif/, typeCompte) ? "fr-tag-active" : ""}`}
          id="tag-comptes-desactives"
          key="tag-comptes-desactives"
          onClick={() => {
            modifierFiltre(["desactive"]);
          }}
          type="button"
        >
          Comptes désactivés
        </button>
      </div>
      <div className="fr-table">
        <table className="tableau fr-m-0 fr-p-0">
          <caption className="fr-sr-only">Tableau des utilisateurs</caption>
          <TableauEnTête<UtilisateurListeGestionContrat> tableau={tableau} />
          <TableauAdminUtilisateursContenu tableau={tableau} />
        </table>
        <TableauPagination
          nombreDePages={tableau.getPageCount()}
          tableau={tableau}
        />
      </div>
    </TableauAdminUtilisateursStyled>
  );
};

export default TableauAdminUtilisateurs;
