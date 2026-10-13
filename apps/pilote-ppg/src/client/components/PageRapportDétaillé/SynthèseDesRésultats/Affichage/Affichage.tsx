import { formaterDate } from "@/client/utils/date/date";
import { SynthèseDesRésultats as SynthèseDesRésultatsInterface } from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";

interface SynthèseDesRésultatsAffichageProps {
  synthèseDesRésultats: SynthèseDesRésultatsInterface;
}

const SynthèseDesRésultatsAffichage = ({
  synthèseDesRésultats,
}: SynthèseDesRésultatsAffichageProps) => {
  if (!synthèseDesRésultats) {
    return (
      <p className="text-sm print:text-base texte-gris">
        Aucune synthèse des résultats.
      </p>
    );
  }

  return (
    <>
      <p className="text-xs print:text-base texte-gris mb-2">
        {`Mis à jour le ${formaterDate(synthèseDesRésultats.date, "DD/MM/YYYY")}`}
        {!!synthèseDesRésultats.auteur &&
          ` | Par ${synthèseDesRésultats.auteur}`}
      </p>
      <div className="m-[var(--text-spacing)] text-sm print:text-base mb-0">
        <RenduContenuHtml
          className="[&_p]:text-sm [&_p]:mb-1"
          html={synthèseDesRésultats.contenu}
        />
      </div>
    </>
  );
};

export default SynthèseDesRésultatsAffichage;
