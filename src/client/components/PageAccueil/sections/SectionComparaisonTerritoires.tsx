import { useEnv } from "@/client/hooks/useEnv";
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionComparaisonTerritoires = () => {
  const featureComparaisonTerritoires = useEnv(
    "NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES",
  );
  const { chantierIds, jalon, mailleQuery, territoireCode } =
    usePageAccueilContext();

  if (!featureComparaisonTerritoires) return null;

  return (
    <section id="comparaison-territoires">
      <TuileWidget titre="Comparaison territoriale et évolution">
        <WidgetCartographieTA
          chantierIds={chantierIds}
          jalon={jalon}
          maille={mailleQuery}
          mode="chantiers"
          territoireCode={territoireCode}
        />
      </TuileWidget>
    </section>
  );
};
