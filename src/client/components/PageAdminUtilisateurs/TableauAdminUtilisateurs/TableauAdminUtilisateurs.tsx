import "@gouvfr/dsfr/dist/component/table/table.min.css";
import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { useTableauPageAdminUtilisateurs } from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs";
import TableauEnTête from "@/components/_commons/TableauNew/EnTête/TableauEnTête";
import TableauPagination from "@/components/_commons/TableauNew/Pagination/TableauPagination";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Titre from "@/components/_commons/Titre/Titre";
import TableauAdminUtilisateursContenu from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";
import Tag from "@/components/_commons/Tag/Tag";

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
    <section className="fr-px-1w [&_tbody>tr]:cursor-pointer [&_tbody>tr:hover:nth-of-type(even)]:bg-[var(--background-contrast-grey-hover)] [&_tbody>tr:hover:nth-of-type(odd)]:bg-[var(--background-alt-grey-hover)] [&_tbody_td]:max-w-[10px] [&_tbody_td]:overflow-hidden [&_tbody_td]:text-ellipsis [&_tbody_td]:whitespace-nowrap [&_nav_button]:rounded">
      <div className="w-full max-w-[20.5rem] fr-mt-2w">
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
      </div>
      <Titre baliseHtml="h2" className="fr-h4 fr-mt-3w fr-mb-0 text-primary">
        {`${nombreUtilisateur} ${nombreUtilisateur > 1 ? "comptes" : "compte"}`}
      </Titre>
      <div className="flex gap-2 !mt-4">
        <Tag
          isActive={
            verifierTypeEstPresent(/desactive/, typeCompte) &&
            verifierTypeEstPresent(/actif/, typeCompte)
          }
          libelle="Tous"
          onClick={() => {
            modifierFiltre(["actif", "desactive"]);
          }}
        />
        <Tag
          isActive={
            verifierTypeEstPresent(/actif/, typeCompte) &&
            !verifierTypeEstPresent(/desactive/, typeCompte)
          }
          libelle="Comptes actifs"
          onClick={() => {
            modifierFiltre(["actif"]);
          }}
        />
        <Tag
          isActive={
            verifierTypeEstPresent(/desactive/, typeCompte) &&
            !verifierTypeEstPresent(/actif/, typeCompte)
          }
          libelle="Comptes désactivés"
          onClick={() => {
            modifierFiltre(["desactive"]);
          }}
        />
      </div>
      <div className="fr-table">
        <table className="tableau table fr-m-0 fr-p-0">
          <caption className="fr-sr-only">Tableau des utilisateurs</caption>
          <TableauEnTête<UtilisateurListeGestionContrat> tableau={tableau} />
          <TableauAdminUtilisateursContenu tableau={tableau} />
        </table>
        <TableauPagination
          nombreDePages={tableau.getPageCount()}
          tableau={tableau}
        />
      </div>
    </section>
  );
};

export default TableauAdminUtilisateurs;
