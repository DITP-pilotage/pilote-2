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
import { useTableauAdminEngagements } from "./useTableauAdminEngagements";

const CLASSES_COLONNES = {
  engagementId: CLASSE_COLONNE_ID,
  engagementShort: CLASSE_COLONNE_SECONDAIRE,
  engagementName: CLASSE_COLONNE_NOM,
  updatedAt: CLASSE_COLONNE_DATE,
};

const LIBELLES = {
  aucun: "Aucun engagement",
  aucunResultat: "Aucun engagement ne correspond à",
};

const PageAdminEngagements = () => {
  const { data: engagements, isLoading } =
    api.metadataEngagement.lister.useQuery();
  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminEngagements(engagements ?? []);
  const nombreEngagementsFiltres = table.getFilteredRowModel().rows.length;

  const [valeursStatut, setValeursStatut] = useFiltreColonne(table, "statut");

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
          <Lien
            href="/panel-administrateur/referentiels-deprecies/engagements/nouveau?_action=creer-engagement"
            label="+ Créer un engagement"
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
          hrefLigne={(engagement) =>
            `/panel-administrateur/referentiels-deprecies/engagements/${engagement.engagementId}`
          }
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminEngagements;
