import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";
import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
import { Button } from "@/components/shared/Button";

import { FunctionComponent } from "react";
import {
  actions as actionsFiltresModifierIndicateursStore,
  filtresModifierIndicateursActifsStore,
} from "@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore";
import { BarreLatérale } from "@/components/_commons/BarreLatérale/BarreLatérale";
import { MultiSelectChantier } from "@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier";
import { api } from "@/server/framework/trpc/api";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { MultiSelectPérimètreMinistériel } from "@/client/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel";
import Interrupteur from "@/client/components/_commons/Interrupteur/Interrupteur";
import { Tag } from "@/components/shared/Tag";
import Titre from "@/client/components/_commons/Titre/Titre";

interface AdminIndicateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean;
  setEstOuverteBarreLatérale: (valeur: boolean) => void;
}

const AdminIndicateurBarreLatérale: FunctionComponent<
  AdminIndicateursBarreLatéraleProps
> = ({ estOuverteBarreLatérale, setEstOuverteBarreLatérale }) => {
  const { sauvegarderFiltres, réinitialiser } =
    actionsFiltresModifierIndicateursStore();
  const filtresActifs = filtresModifierIndicateursActifsStore();

  const { data: chantiers } =
    api.chantier.recupererTousSynthetisesAccessiblesEnLecture.useQuery(
      undefined,
      { staleTime: Number.POSITIVE_INFINITY },
    );
  const { data: périmètresMinistériels } =
    api.perimetreMinisteriel.list.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });

  const chantierAAfficher =
    filtresActifs.perimetresMinisteriels.length > 0
      ? chantiers?.filter((chantier) =>
          chantier.périmètreIds.some((element) =>
            filtresActifs.perimetresMinisteriels.includes(element),
          ),
        )
      : chantiers;

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className="flex flex-col gap-4">
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(perimetresMinisteriel) => {
              sauvegarderFiltres({
                perimetresMinisteriels: perimetresMinisteriel,
              });
            }}
            listePerimetresMinisteriel={périmètresMinistériels ?? []}
            périmètresMinistérielsIdsSélectionnésParDéfaut={
              filtresActifs.perimetresMinisteriels
            }
          />
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantier) => {
              sauvegarderFiltres({ chantiers: chantier });
            }}
            chantiers={chantierAAfficher ?? []}
            chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
          />
          <Interrupteur
            checked={filtresActifs.estTerritorialise}
            libellé="Indicateurs territorialisés"
            onChange={(estTerritorialise) => {
              sauvegarderFiltres({ estTerritorialise: estTerritorialise });
            }}
          />
          <Interrupteur
            checked={filtresActifs.estBarometre}
            libellé="Indicateurs du baromètre"
            onChange={(estBarometre) => {
              sauvegarderFiltres({ estBarometre: estBarometre });
            }}
          />
        </div>
      </BarreLatéraleEncart>
      <div className="fr-px-3w fr-py-2w">
        <Titre baliseHtml="h2" className="fr-h4">
          Filtres actifs
        </Titre>
        <Button variant="secondary" onClick={réinitialiser} type="button">
          Réinitialiser les filtres
        </Button>
        <CollapsibleSection defaultOpen title="Périmètre(s) ministériel(s)">
          {filtresActifs.perimetresMinisteriels.map((perimetreId) => {
            const label =
              périmètresMinistériels?.find(
                (périmètre) => périmètre.id === perimetreId,
              )?.nom ?? null;
            return label === null ? null : (
              <Tag
                key={perimetreId}
                onClick={() => {
                  const filtresApresSuppression =
                    filtresActifs.perimetresMinisteriels.toSpliced(
                      filtresActifs.perimetresMinisteriels.indexOf(perimetreId),
                      1,
                    );
                  sauvegarderFiltres({
                    perimetresMinisteriels: filtresApresSuppression,
                  });
                }}
              >
                {label}
              </Tag>
            );
          })}
        </CollapsibleSection>
        <CollapsibleSection defaultOpen title="Chantier(s)">
          {filtresActifs.chantiers.map((chantierId) => {
            const label =
              chantiers?.find((chantier) => chantier.id === chantierId)?.nom ??
              null;
            return label === null ? null : (
              <Tag
                key={chantierId}
                onClick={() => {
                  const filtresApresSuppression =
                    filtresActifs.chantiers.toSpliced(
                      filtresActifs.chantiers.indexOf(chantierId),
                      1,
                    );
                  sauvegarderFiltres({ chantiers: filtresApresSuppression });
                }}
              >
                {label}
              </Tag>
            );
          })}
        </CollapsibleSection>
        <CollapsibleSection defaultOpen title="Autre(s) filtre(s)">
          {filtresActifs.estTerritorialise ? (
            <Tag
              key="estTerritorialise"
              onClick={() => {
                sauvegarderFiltres({ estTerritorialise: false });
              }}
            >
              Indicateurs territorialisés
            </Tag>
          ) : null}
          {filtresActifs.estBarometre ? (
            <Tag
              key="estBarometre"
              onClick={() => {
                sauvegarderFiltres({ estBarometre: false });
              }}
            >
              Indicateurs du baromètre
            </Tag>
          ) : null}
        </CollapsibleSection>
      </div>
    </BarreLatérale>
  );
};

export default AdminIndicateurBarreLatérale;
