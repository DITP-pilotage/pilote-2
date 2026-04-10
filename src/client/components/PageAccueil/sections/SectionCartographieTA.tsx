import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionCartographieTA = () => {
  const { chantierIds, jalon, mailleQuery } = usePageAccueilContext();

  return (
    <section id="taux-avancement-territoires" className="pt-4">
      <TuileWidget titre="Taux d'avancement des chantiers par territoire">
        <WidgetCartographieTA
          chantierIds={chantierIds}
          jalon={jalon}
          maille={mailleQuery}
        />
      </TuileWidget>
    </section>
  );
};
