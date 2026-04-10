import { useEnv } from "@/client/hooks/useEnv";
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTAComparaison } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/WidgetCartographieTAComparaison";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionComparaisonTerritoires = () => {
  const featureComparaisonTerritoires = useEnv(
    "NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES",
  );
  const { chantierIds, jalon, mailleQuery, territoireCode } =
    usePageAccueilContext();

  if (!featureComparaisonTerritoires) return null;

  return (
    <section id="comparaison-territoires" className="pt-4">
      <TuileWidget titre="Comparaison territoriale et évolution">
        <WidgetCartographieTAComparaison
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
