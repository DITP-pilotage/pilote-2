import { useCallback, useMemo } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { BaseCartographieWidgetLayout } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE } from "@/client/constants/légendes/élémentsDeLégendesCartographieValeurAvancement";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import {
  SelecteurVueWidget,
  VueWidget,
} from "@/components/_commons/Widget/SelecteurVueWidget";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { buildJalons } from "@/client/utils/jalons";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import { useDonneesCartographieVA } from "./useDonneesCartographieVA";
import { LegendeDegradeVA } from "./LegendeDegradeVA";
import { SuiviValeurAvancement } from "./SuiviValeurAvancement";
import { TableauEvolutionVA } from "./TableauEvolutionVA";

const COULEUR_MIN = "#8bcdb1";
const COULEUR_MAX = "#083a25";

const formatValeurVA = (
  valeur: number | null,
  unite: string | null,
): string | null => {
  if (valeur === null) return null;
  const unitéAffichée = unite?.toLocaleLowerCase() === "pourcentage" ? "%" : "";
  return valeur.toLocaleString() + unitéAffichée;
};

export const WidgetCartographieValeurAvancement = ({
  indicateurId,
  chantierId,
  maille,
  territoireCode,
  jalon,
  unite,
}: {
  indicateurId: string;
  chantierId: string;
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
  unite: string | null;
}) => {
  const [territoiresValeurAvancement] =
    api.indicateur.recupererValeursAvancementTerritoires.useSuspenseQuery(
      { indicateurId, chantierId, jalon },
      { staleTime: WIDGET_STALE_TIME },
    );

  const [statistiques] =
    api.indicateur.recupererStatistiquesValeurAvancement.useSuspenseQuery(
      { indicateurId, chantierId, maille, jalon },
      { staleTime: WIDGET_STALE_TIME },
    );

  const donneesCartographie = useDonneesCartographieVA(
    territoiresValeurAvancement,
    statistiques.minimum,
    statistiques.maximum,
    jalon,
    unite,
  );

  const legendeItems = useMemo(() => {
    const tousApplicables = territoiresValeurAvancement.every(
      (territoire) => territoire.estApplicable,
    );
    const tousNonNull = territoiresValeurAvancement.every(
      (territoire) => territoire.valeurAvancement !== null,
    );

    return Object.values(ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE)
      .filter(
        (el) =>
          !tousApplicables ||
          el.libellé !==
            "Territoire où le chantier prioritaire ne s'applique pas",
      )
      .filter(
        (el) =>
          !tousNonNull ||
          el.libellé !==
            "Territoire pour lequel la donnée n'est pas renseignée/disponible",
      )
      .map(({ remplissage, libellé }) => ({ libellé, remplissage }));
  }, [territoiresValeurAvancement]);

  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({
    territoires: territoiresValeurAvancement,
    territoireCode,
  });

  const libelleDegrade =
    unite === null || unite === undefined
      ? ""
      : `En ${unite.toLocaleLowerCase()}`;

  const utils = api.useUtils();
  const handlePrefetchVue = useCallback(
    (vue: VueWidget) => {
      if (vue === "tableau") {
        const jalons = buildJalons();
        for (const jalon of jalons) {
          void utils.indicateur.recupererValeursAvancementTerritoires.prefetch(
            {
              indicateurId,
              chantierId,
              jalon,
            },
            { staleTime: WIDGET_STALE_TIME },
          );
        }
      }
    },
    [utils, indicateurId, chantierId],
  );

  return (
    <BaseCartographieWidgetLayout
      titre={
        <WidgetCartographieTitle
          title="Valeurs d'avancement"
          subtitle={String(jalon)}
        />
      }
      cartographie={
        <CartographieV2
          onTerritoireSelect={onSelectTerritoire}
          donnees={donneesCartographie}
          maille={maille}
          territoiresSelectionnes={territoiresSelectionnes.map(
            (territoire) => territoire.territoireCode,
          )}
        />
      }
      complementsCartographie={
        <ComplementsCartographie>
          <ValeursRemarquables
            valeurs={{
              minimum: formatValeurVA(statistiques.minimum, unite),
              mediane: formatValeurVA(statistiques.médiane, unite),
              maximum: formatValeurVA(statistiques.maximum, unite),
            }}
            palette={{
              minimum: "#8bcdb1",
              mediane: "#47a882",
              maximum: "#083a25",
            }}
            maille={maille}
          />
          <LegendeDegradeVA
            libelle={libelleDegrade}
            valeurMin={
              statistiques.minimum !== null
                ? statistiques.minimum.toLocaleString()
                : "-"
            }
            valeurMax={
              statistiques.maximum !== null
                ? statistiques.maximum.toLocaleString()
                : "-"
            }
            couleurMin={COULEUR_MIN}
            couleurMax={COULEUR_MAX}
          />
          <LegendeCartographie items={legendeItems} />
        </ComplementsCartographie>
      }
      footer={
        <AjouterTerritoirePicker
          territoiresSelectionnesCodes={territoiresSelectionnes.map(
            (territoire) => territoire.territoireCode,
          )}
          onAjouterTerritoire={ajouterTerritoire}
          onAjouterTerritoires={ajouterTerritoires}
        />
      }
    >
      <SelecteurVueWidget
        titre="Suivi et évolution des valeurs d'avancement"
        jalon={jalon}
        onPrefetchVue={handlePrefetchVue}
        renderVue={(vue) => {
          if (vue === "situation") {
            return (
              <SuiviValeurAvancement
                territoireCode={territoireCode}
                onSupprimerTerritoire={supprimerTerritoire}
                territoiresSelectionnes={territoiresSelectionnes}
                unite={unite}
              />
            );
          }
          if (vue === "tableau") {
            return (
              <TableauEvolutionVA
                indicateurId={indicateurId}
                chantierId={chantierId}
                territoiresSelectionnes={territoiresSelectionnes}
                territoireCode={territoireCode}
                onSupprimerTerritoire={supprimerTerritoire}
                jalonActif={jalon}
                unite={unite}
              />
            );
          }
          return null;
        }}
      />
    </BaseCartographieWidgetLayout>
  );
};
