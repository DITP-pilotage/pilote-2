import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { useTableauPageAdminUtilisateurs } from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Titre from "@/components/_commons/Titre/Titre";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";
import Tag from "@/components/_commons/Tag/Tag";

const TableauAdminUtilisateurs: FunctionComponent<{
  listeUtilisateurs: UtilisateurListeGestionContrat[];
  nombreUtilisateur: number;
}> = ({ listeUtilisateurs, nombreUtilisateur }) => {
  const { table, changementDeLaRechercheCallback, valeurDeLaRecherche } =
    useTableauPageAdminUtilisateurs(listeUtilisateurs, nombreUtilisateur);

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
    table.setPageIndex(0);
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
      <table.Root
        caption="Tableau des utilisateurs"
        captionHidden
        className="m-0 p-0"
        containerClassName="mt-4"
        empty={{ title: "Aucun compte ne correspond à votre recherche." }}
      >
        <table.Header cellClassName="py-2 md:py-2" />
        <table.Body
          cellClassName="py-2 md:py-2 max-w-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
          cellTitle
          rowClassName="even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
        />
      </table.Root>
      <table.Pagination />
    </section>
  );
};

export default TableauAdminUtilisateurs;
