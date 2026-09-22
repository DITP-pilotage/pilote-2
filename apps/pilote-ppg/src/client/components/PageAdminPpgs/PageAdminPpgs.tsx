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
import { useTableauAdminPpgs } from "./useTableauAdminPpgs";

const CLASSES_COLONNES = {
  ppgId: CLASSE_COLONNE_ID,
  ppgNom: CLASSE_COLONNE_NOM,
  ppgAxe: CLASSE_COLONNE_SECONDAIRE,
  updatedAt: CLASSE_COLONNE_DATE,
};

const LIBELLES = {
  aucun: "Aucun PPG",
  aucunResultat: "Aucun PPG ne correspond à",
};

const PageAdminPpgs = () => {
  const { data: ppgs, isLoading } = api.metadataPpg.lister.useQuery();
  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminPpgs(ppgs ?? []);
  const nombrePpgsFiltres = table.getFilteredRowModel().rows.length;

  const [valeursStatut, setValeursStatut] = useFiltreColonne(table, "statut");

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels dépréciés
            </p>
            <h1 className="text-3xl font-bold text-gray-900">PPG</h1>
            {!isLoading && ppgs && (
              <p className="mt-1 text-sm text-gray-500">
                {nombrePpgsFiltres} PPG
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels-deprecies/ppgs/nouveau?_action=creer-ppg"
            label="+ Créer un PPG"
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
          hrefLigne={(ppg) =>
            `/panel-administrateur/referentiels-deprecies/ppgs/${ppg.ppgId}`
          }
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminPpgs;
