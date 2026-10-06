import { api } from "@/server/framework/trpc/api";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminPorteurs } from "./useTableauAdminPorteurs";

const LIBELLES = {
  aucun: "Aucun porteur",
  aucunResultat: "Aucun porteur ne correspond à",
};

const PageAdminPorteurs = () => {
  const { data: porteurs, isLoading } = api.metadataPorteur.list.useQuery();
  const table = useTableauAdminPorteurs(porteurs ?? []);
  const nombrePorteursFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Porteurs</h1>
            {!isLoading && porteurs && (
              <p className="mt-1 text-sm text-gray-500">
                {nombrePorteursFiltres} porteur
                {nombrePorteursFiltres !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button asChild variant="primary">
            <Link href="/panel-administrateur/referentiels/porteurs/nouveau?_action=creer-porteur">
              + Créer un porteur
            </Link>
          </Button>
        </div>

        <TableauAdmin
          caption="Liste des porteurs"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminPorteurs;
