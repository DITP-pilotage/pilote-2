import { FunctionComponent } from "react";
import { useTableauPageAdminUtilisateurs } from "@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/useTableauAdminUtilisateurs";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";
import { TagToggleGroup } from "@/components/shared/Tag";
import { TYPES_COMPTE } from "@/client/searchParams/adminUtilisateursSearchParams";
import { useAdminUtilisateursSearchParams } from "@/components/PageAdminUtilisateurs/useAdminUtilisateursSearchParams";

const TableauAdminUtilisateurs: FunctionComponent<{
  listeUtilisateurs: UtilisateurListeGestionContrat[];
  nombreUtilisateur: number;
}> = ({ listeUtilisateurs, nombreUtilisateur }) => {
  const { table } = useTableauPageAdminUtilisateurs(
    listeUtilisateurs,
    nombreUtilisateur,
  );

  const { params, setFilter } = useAdminUtilisateursSearchParams();

  return (
    <section>
      <div className="w-full max-w-[20.5rem]">
        <table.Search />
      </div>
      <h2
        aria-live="polite"
        className="text-h4 md:text-h4-md mt-6 mb-0 text-primary"
      >
        {`${nombreUtilisateur} ${nombreUtilisateur > 1 ? "comptes" : "compte"}`}
      </h2>
      <TagToggleGroup.Root
        aria-label="Type de compte"
        className="mt-4"
        onValueChange={(value) =>
          setFilter(
            "typeCompte",
            TYPES_COMPTE.filter((typeCompte) =>
              value.split(",").includes(typeCompte),
            ),
          )
        }
        value={params.typeCompte.join(",")}
      >
        <TagToggleGroup.Item value="actif,desactive">Tous</TagToggleGroup.Item>
        <TagToggleGroup.Item value="actif">Comptes actifs</TagToggleGroup.Item>
        <TagToggleGroup.Item value="desactive">
          Comptes désactivés
        </TagToggleGroup.Item>
      </TagToggleGroup.Root>
      <table.Root
        caption="Tableau des utilisateurs"
        captionHidden
        className="m-0 p-0"
        containerClassName="mt-4"
        empty={{
          title: "Aucun compte ne correspond à votre recherche.",
          description: (
            <p className="mb-0">
              Modifiez votre recherche, le type de compte ou les filtres actifs.
            </p>
          ),
        }}
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
