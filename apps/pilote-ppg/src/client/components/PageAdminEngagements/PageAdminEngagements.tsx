import api from "@/server/infrastructure/api/trpc/api";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { useTableauAdminEngagements } from "./useTableauAdminEngagements";

const LIBELLES = {
  aucun: "Aucun engagement",
  aucunResultat: "Aucun engagement ne correspond à",
};

const PageAdminEngagements = () => {
  const { data: engagements, isLoading } =
    api.metadataEngagement.lister.useQuery();
  const table = useTableauAdminEngagements(engagements ?? []);
  const nombreEngagementsFiltres = table.getFilteredRowModel().rows.length;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels dépréciés
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Engagements</h1>
            {!isLoading && engagements && (
              <p className="mt-1 text-sm text-gray-500">
                {nombreEngagementsFiltres} engagement
                {nombreEngagementsFiltres !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button asChild variant="primary">
            <Link href="/panel-administrateur/referentiels-deprecies/engagements/nouveau?_action=creer-engagement">
              + Créer un engagement
            </Link>
          </Button>
        </div>

        <TableauAdmin
          caption="Liste des engagements"
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminEngagements;
