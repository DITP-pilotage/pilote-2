import { WidgetChantiersSignales } from "@/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionChantiersSignales = () => {
  const { chantierIdsSansFiltrageAlertes, territoireCode, jalonParDefaut } =
    usePageAccueilContext();

  return (
    <section id="chantiers-signales">
      <WidgetChantiersSignales
        chantierIds={chantierIdsSansFiltrageAlertes}
        jalonParDefaut={jalonParDefaut}
        territoireCode={territoireCode}
      />
    </section>
  );
};
