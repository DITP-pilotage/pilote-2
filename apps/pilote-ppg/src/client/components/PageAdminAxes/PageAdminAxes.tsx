import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminAxes } from "./useTableauAdminAxes";

const LIBELLES = {
  aucun: "Aucun axe",
  aucunResultat: "Aucun axe ne correspond à",
};

const PageAdminAxes = () => {
  const { data: axes, isLoading } = api.metadataAxe.lister.useQuery();
  const table = useTableauAdminAxes(axes ?? []);
  const nombreAxesFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels dépréciés
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Axes</h1>
            {!isLoading && axes && (
              <p className="mt-1 text-sm text-gray-500">
                {nombreAxesFiltres} axe{nombreAxesFiltres !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels-deprecies/axes/nouveau?_action=creer-axe"
            label="+ Créer un axe"
            variant="button"
          />
        </div>

        <TableauAdmin
          caption="Liste des axes"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminAxes;
