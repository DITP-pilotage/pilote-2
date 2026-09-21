import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import { TableauAdmin } from "@/components/_commons/TableauAdmin/TableauAdmin";
import {
  CLASSE_COLONNE_DATE,
  CLASSE_COLONNE_ID,
  CLASSE_COLONNE_NOM,
} from "@/components/_commons/TableauAdmin/classesColonnes";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";
import { FiltresAdminChantiers } from "./FiltresAdminChantiers";

const CLASSES_COLONNES = {
  chantierId: CLASSE_COLONNE_ID,
  chNom: CLASSE_COLONNE_NOM,
  updatedAt: CLASSE_COLONNE_DATE,
};

const LIBELLES = {
  aucun: "Aucun chantier",
  aucunResultat: "Aucun chantier ne correspond à",
  invitationCreation: "Créez votre premier chantier pour commencer.",
  iconeVide: "📋",
};

const PageAdminChantiers = () => {
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const { data: perimetres } = api.metadataChantier.listerPerimetres.useQuery();

  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminChantiers(chantiers ?? []);
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
          <Lien
            href="/panel-administrateur/chantiers/nouveau?_action=creer-chantier"
            label="+ Créer un chantier"
            variant="button"
          />
        </div>

        <TableauAdmin
          aDesFiltresActifs={aDesFiltresActifs}
          classesColonnes={CLASSES_COLONNES}
          filtres={
            <FiltresAdminChantiers
              aDesFiltresActifs={aDesFiltresActifs}
              perimetres={perimetres ?? []}
              reinitialiserLesFiltres={reinitialiserLesFiltres}
              table={table}
            />
          }
          hrefLigne={(chantier) =>
            `/panel-administrateur/chantiers/${chantier.chantierId}`
          }
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminChantiers;
