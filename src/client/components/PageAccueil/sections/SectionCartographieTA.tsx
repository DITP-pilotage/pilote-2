import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionCartographieTA = () => {
  const { chantierIds, jalon, mailleQuery, territoireCode } =
    usePageAccueilContext();

  return (
    <section id="repartition-territoriale">
      <TuileWidget titre="Répartition territoriale">
        <WidgetCartographieTA
          chantierIds={chantierIds}
          jalon={jalon}
          maille={mailleQuery}
          territoireCode={territoireCode}
        />
      </TuileWidget>
    </section>
  );
};
