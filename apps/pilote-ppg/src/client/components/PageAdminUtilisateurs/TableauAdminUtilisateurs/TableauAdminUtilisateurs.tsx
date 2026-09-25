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
import {
  SANS_ESPACEMENT_TEXTE_DSFR,
  Tableau,
} from "@/components/shared/Tableau";
import { clsxm } from "@/utils/clsxm";

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
    <section className="fr-px-1w">
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
      <div className={clsxm("relative pt-4 mb-10", SANS_ESPACEMENT_TEXTE_DSFR)}>
        <Tableau>
          <caption className="sr-only">Tableau des utilisateurs</caption>
          <TableauEnTête tableau={tableau} />
          <TableauAdminUtilisateursContenu tableau={tableau} />
        </Tableau>
        <TableauPagination
          nombreDePages={tableau.getPageCount()}
          tableau={tableau}
        />
      </div>
    </section>
  );
};

export default TableauAdminUtilisateurs;
