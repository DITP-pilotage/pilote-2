import { api } from "@/server/framework/trpc/api";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminPerimetres } from "./useTableauAdminPerimetres";

const LIBELLES = {
  aucun: "Aucun périmètre",
  aucunResultat: "Aucun périmètre ne correspond à",
};

const PageAdminPerimetres = () => {
  const { data: perimetres, isLoading } =
    api.metadataPerimetre.lister.useQuery();
  const { data: porteurs } = api.metadataPorteur.lister.useQuery();
  const table = useTableauAdminPerimetres(perimetres ?? [], porteurs);
  const nombrePerimetresFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Périmètres</h1>
            {!isLoading && perimetres && (
              <p className="mt-1 text-sm text-gray-500">
                {nombrePerimetresFiltres} périmètre
                {nombrePerimetresFiltres !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button asChild variant="primary">
            <Link href="/panel-administrateur/referentiels/perimetres/nouveau?_action=creer-perimetre">
              + Créer un périmètre
            </Link>
          </Button>
        </div>

        <TableauAdmin
          caption="Liste des périmètres"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminPerimetres;
