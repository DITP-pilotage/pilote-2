import { api } from "@/server/framework/trpc/api";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";

const LIBELLES = {
  aucun: "Aucun chantier",
  aucunResultat: "Aucun chantier ne correspond à",
  invitationCreation: "Créez votre premier chantier pour commencer.",
  iconeVide: "📋",
};

const PageAdminChantiers = () => {
  const { data: chantiers, isLoading } = api.metadataChantier.list.useQuery();
  const { data: perimetres } = api.metadataChantier.listPerimetres.useQuery();

  const table = useTableauAdminChantiers(chantiers ?? [], perimetres);
  const nombreChantiersFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Panel administrateur
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des chantiers
            </h1>
            {!isLoading && chantiers && (
              <p className="mt-1 text-sm text-gray-500">
                {nombreChantiersFiltres} chantier
                {nombreChantiersFiltres !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button asChild variant="primary">
            <Link href="/panel-administrateur/chantiers/nouveau?_action=creer-chantier">
              + Créer un chantier
            </Link>
          </Button>
        </div>

        <TableauAdmin
          caption="Liste des chantiers"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminChantiers;
