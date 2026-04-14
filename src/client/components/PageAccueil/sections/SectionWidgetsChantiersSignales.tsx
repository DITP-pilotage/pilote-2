import { useEnv } from "@/client/hooks/useEnv";
import { WidgetRepartitionMeteos } from "@/components/_commons/Widget/WidgetRepartitionMeteos/WidgetRepartitionMeteos";
import { WidgetChantiersSignales } from "@/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionWidgetsChantiersSignales = () => {
  const {
    chantierIds,
    chantierIdsSansFiltrageAlertes,
    territoireCode,
    jalonParDefaut,
  } = usePageAccueilContext();

  const featureChantiersSignalesV2 = useEnv(
    "NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2",
  );
  const featureRepartitionMeteosV2 = useEnv(
    "NEXT_PUBLIC_FF_REPARTITION_METEOS_V2",
  );

  if (!featureChantiersSignalesV2) return null;

  return (
    <section
      className="pt-4 px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 gap-4"
      id="widgets-chantiers-signales"
    >
      {featureRepartitionMeteosV2 ? (
        <WidgetRepartitionMeteos
          chantierIds={chantierIds}
          territoireCode={territoireCode}
        />
      ) : null}
      <WidgetChantiersSignales
        chantierIds={chantierIdsSansFiltrageAlertes}
        jalonParDefaut={jalonParDefaut}
        territoireCode={territoireCode}
      />
    </section>
  );
};
