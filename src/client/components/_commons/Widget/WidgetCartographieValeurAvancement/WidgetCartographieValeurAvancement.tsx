import { startTransition, useMemo, useState } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { PillToggleGroup } from "@/components/shared/PillToggleGroup";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { EqualizerIcon } from "@/components/_commons/Icones/EqualizerIcon";
import { GridIcon } from "@/components/_commons/Icones/GridIcon";
import { LineChartIcon } from "@/components/_commons/Icones/LineChartIcon";
import { BaseCartographieWidgetLayout } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE } from "@/client/constants/légendes/élémentsDeLégendesCartographieValeurAvancement";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";
import { useDonneesCartographieVA } from "./useDonneesCartographieVA";
import { LegendeDegradeVA } from "./LegendeDegradeVA";
import { SuiviValeurAvancement } from "./SuiviValeurAvancement";
import { TableauEvolutionVA } from "./TableauEvolutionVA";

type VueCartographieVA = "situation" | "tableau" | "courbes";

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
  const [vueActive, setVueActive] = useState<VueCartographieVA>("situation");

  const [territoiresValeurAvancement] =
    api.indicateur.recupererValeursAvancementTerritoires.useSuspenseQuery({
      indicateurId,
      chantierId,
      jalon,
    });

  const [statistiques] =
    api.indicateur.recupererStatistiquesValeurAvancement.useSuspenseQuery({
      indicateurId,
      chantierId,
      maille,
      jalon,
    });

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

  return (
    <BaseCartographieWidgetLayout
      cartographie={
        <CartographieV2
          onTerritoireSelect={onSelectTerritoire}
          donnees={donneesCartographie}
          maille={maille}
          territoiresSelectionnes={territoiresSelectionnes.map(
            (territoire) => territoire.territoireCode,
          )}
        >
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
        </CartographieV2>
      }
      titre="Suivi et évolution des valeurs d'avancement"
    >
      <PillToggleGroup.Root
        type="single"
        value={vueActive}
        onValueChange={(value) => {
          if (value) {
            startTransition(() => {
              setVueActive(value as VueCartographieVA);
            });
          }
        }}
      >
        <PillToggleGroup.Item value="situation">
          <EqualizerIcon className="w-3 h-3" />
          situation en {jalon}
        </PillToggleGroup.Item>
        <PillToggleGroup.Item value="tableau">
          <GridIcon className="w-3 h-3" />
          évolution temporelle - tableau
        </PillToggleGroup.Item>
        <PillToggleGroup.Item value="courbes">
          <LineChartIcon className="w-3 h-3" />
          évolution temporelle - courbes
        </PillToggleGroup.Item>
      </PillToggleGroup.Root>

      {vueActive === "situation" && (
        <SuiviValeurAvancement
          territoireCode={territoireCode}
          onSupprimerTerritoire={supprimerTerritoire}
          territoiresSelectionnes={territoiresSelectionnes}
          unite={unite}
          statistiques={statistiques}
        />
      )}
      {vueActive === "tableau" && (
        <TableauEvolutionVA
          indicateurId={indicateurId}
          chantierId={chantierId}
          territoiresSelectionnes={territoiresSelectionnes}
          territoireCode={territoireCode}
          onSupprimerTerritoire={supprimerTerritoire}
          jalonActif={jalon}
          unite={unite}
        />
      )}
      <AjouterTerritoirePicker
        territoiresSelectionnesCodes={territoiresSelectionnes.map(
          (territoire) => territoire.territoireCode,
        )}
        onAjouterTerritoire={ajouterTerritoire}
        onAjouterTerritoires={ajouterTerritoires}
      />
    </BaseCartographieWidgetLayout>
  );
};
