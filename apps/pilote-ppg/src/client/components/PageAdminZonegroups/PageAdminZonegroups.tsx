import api from "@/server/infrastructure/api/trpc/api";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminZonegroups } from "./useTableauAdminZonegroups";

const LIBELLES = {
  aucun: "Aucun groupe de zones",
  aucunResultat: "Aucun groupe ne correspond à",
};

const PageAdminZonegroups = () => {
  const { data: zonegroups, isLoading } =
    api.metadataZonegroup.lister.useQuery();
  const table = useTableauAdminZonegroups(zonegroups ?? []);
  const nombreZonegroupsFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Zones groupes</h1>
            {!isLoading && zonegroups && (
              <p className="mt-1 text-sm text-gray-500">
                {nombreZonegroupsFiltres} zone
                {nombreZonegroupsFiltres !== 1 ? "s" : ""} groupe
              </p>
            )}
          </div>
          <Button asChild variant="primary">
            <Link href="/panel-administrateur/referentiels/zonegroups/nouveau?_action=creer-zonegroup">
              + Créer un groupe
            </Link>
          </Button>
        </div>

        <TableauAdmin
          caption="Liste des groupes de zones"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminZonegroups;
