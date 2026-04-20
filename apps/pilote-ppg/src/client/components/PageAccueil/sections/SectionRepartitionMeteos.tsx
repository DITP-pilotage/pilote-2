import { WidgetRepartitionMeteos } from "@/components/_commons/Widget/WidgetRepartitionMeteos/WidgetRepartitionMeteos";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionRepartitionMeteos = () => {
  const { chantierIds, territoireCode } = usePageAccueilContext();

  return (
    <section id="repartition-meteos">
      <WidgetRepartitionMeteos
        chantierIds={chantierIds}
        territoireCode={territoireCode}
      />
    </section>
  );
};
