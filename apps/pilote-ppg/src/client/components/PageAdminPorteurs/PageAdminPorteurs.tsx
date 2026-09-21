import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import { FiltresTableauAdmin } from "@/components/_commons/TableauAdmin/FiltresTableauAdmin";
import { FiltreCasesACocher } from "@/components/_commons/TableauAdmin/FiltreCasesACocher";
import { OPTIONS_STATUT_REFERENTIEL } from "@/components/_commons/TableauAdmin/statutReferentiel";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
} from "@/components/_commons/TableauAdmin/classesColonnes";
import {
  OPTIONS_TYPE_PORTEUR,
  useTableauAdminPorteurs,
} from "./useTableauAdminPorteurs";

const CLASSES_COLONNES = {
  porteurId: CLASSE_COLONNE_ID,
  porteurShort: CLASSE_COLONNE_NOM,
  porteurName: "text-gray-700",
  updatedAt: CLASSE_COLONNE_DATE,
};

const LIBELLES = {
  aucun: "Aucun porteur",
  aucunResultat: "Aucun porteur ne correspond à",
};

const PageAdminPorteurs = () => {
  const { data: porteurs, isLoading } = api.metadataPorteur.lister.useQuery();
  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminPorteurs(porteurs ?? []);
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
          <Lien
            href="/panel-administrateur/referentiels/porteurs/nouveau?_action=creer-porteur"
            label="+ Créer un porteur"
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
              <FiltreCasesACocher
                colonne={table.getColumn("statut")}
                label="Statut :"
                options={OPTIONS_STATUT_REFERENTIEL}
              />
              <FiltreCasesACocher
                colonne={table.getColumn("porteurType")}
                label="Type :"
                options={OPTIONS_TYPE_PORTEUR}
              />
            </FiltresTableauAdmin>
          }
          hrefLigne={(porteur) =>
            `/panel-administrateur/referentiels/porteurs/${porteur.porteurId}`
          }
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminPorteurs;
