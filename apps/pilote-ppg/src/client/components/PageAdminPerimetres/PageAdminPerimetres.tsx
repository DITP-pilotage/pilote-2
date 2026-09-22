import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { Lien } from "@/components/_commons/Lien/Lien";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
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
import { useTableauAdminPerimetres } from "./useTableauAdminPerimetres";

const CLASSES_COLONNES = {
  perimetreId: CLASSE_COLONNE_ID,
  perNom: CLASSE_COLONNE_NOM,
  porteurId: CLASSE_COLONNE_SECONDAIRE,
  updatedAt: CLASSE_COLONNE_DATE,
};

const LIBELLES = {
  aucun: "Aucun périmètre",
  aucunResultat: "Aucun périmètre ne correspond à",
};

const PageAdminPerimetres = () => {
  const { data: perimetres, isLoading } =
    api.metadataPerimetre.lister.useQuery();
  const { data: porteurs } = api.metadataPorteur.lister.useQuery();
  const { table, aDesFiltresActifs, reinitialiserLesFiltres } =
    useTableauAdminPerimetres(perimetres ?? []);
  const nombrePerimetresFiltres = table.getFilteredRowModel().rows.length;

  const libellesPorteursParId = useMemo(
    () =>
      new Map(
        (porteurs ?? []).map((porteur) => [
          porteur.porteurId,
          porteur.porteurShort,
        ]),
      ),
    [porteurs],
  );

  const [valeursStatut, setValeursStatut] = useFiltreColonne(table, "statut");
  const [valeursPorteur, setValeursPorteur] = useFiltreColonne(
    table,
    "porteurId",
  );

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
          <Lien
            href="/panel-administrateur/referentiels/perimetres/nouveau?_action=creer-perimetre"
            label="+ Créer un périmètre"
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
              <MultiSelectFiltre
                className="max-w-fit"
                classNameBouton="min-w-[20rem]"
                getOptionLabel={(value) =>
                  libellesPorteursParId.get(value) ?? value
                }
                label="Porteur"
                onChange={setValeursPorteur}
                optionGroups={[
                  {
                    label: "",
                    options: (porteurs ?? []).map(
                      (porteur) => porteur.porteurId,
                    ),
                  },
                ]}
                showGroupSelection={false}
                values={valeursPorteur}
              />
            </FiltresTableauAdmin>
          }
          hrefLigne={(perimetre) =>
            `/panel-administrateur/referentiels/perimetres/${perimetre.perimetreId}`
          }
          isLoading={isLoading}
          libelles={LIBELLES}
          table={table}
        />
      </div>
    </div>
  );
};

export default PageAdminPerimetres;
