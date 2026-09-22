import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { FiltresTableauAdmin } from "@/components/_commons/TableauAdmin/FiltresTableauAdmin";
import { GroupeCasesACocher } from "@/components/_commons/GroupeCasesACocher/GroupeCasesACocher";
import { useFiltreColonne } from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
  CLASSE_COLONNE_SECONDAIRE,
  OPTIONS_STATUT_REFERENTIEL,
} from "@/components/_commons/TableauAdmin/constants";
import { useTableauAdminZonegroups } from "./useTableauAdminZonegroups";

const CLASSES_COLONNES = {
  zoneGroupId: CLASSE_COLONNE_ID,
  zgName: CLASSE_COLONNE_NOM,
  nbZones: CLASSE_COLONNE_SECONDAIRE,
  updatedAt: CLASSE_COLONNE_DATE,
};

const LIBELLES = {
  aucun: "Aucun groupe de zones",
  aucunResultat: "Aucun groupe ne correspond à",
};

const PageAdminZonegroups = () => {
  const { data: zonegroups, isLoading } =
    api.metadataZonegroup.lister.useQuery();
  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminZonegroups(zonegroups ?? []);
  const nombreZonegroupsFiltres = table.getFilteredRowModel().rows.length;

  const [valeursStatut, setValeursStatut] = useFiltreColonne(table, "statut");

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
          <Lien
            href="/panel-administrateur/referentiels/zonegroups/nouveau?_action=creer-zonegroup"
            label="+ Créer un groupe"
            variant="button"
          />
        </div>

        <TableauAdmin
          aDesFiltresActifs={aDesFiltresActifs}
          classesColonnes={CLASSES_COLONNES}
          filtres={
            <FiltresTableauAdmin
              aDesFiltresActifs={aDesFiltresActifs}
              reinitialiserLesFiltres={reinitialiserLesFiltres}
              table={table}
            >
              <GroupeCasesACocher
                label="Statut :"
                onChange={setValeursStatut}
                options={OPTIONS_STATUT_REFERENTIEL}
                values={valeursStatut}
              />
            </FiltresTableauAdmin>
          }
          hrefLigne={(zonegroup) =>
            `/panel-administrateur/referentiels/zonegroups/${zonegroup.zoneGroupId}`
          }
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminZonegroups;
