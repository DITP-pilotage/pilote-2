import { CritereOuObjectif } from "@/components/Evaluation/FicheCadrage";
import { useSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";
import { Icone } from "@/components/_commons/Icone";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";

export const BoutonEnSavoirPlus = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif;
}) => {
  const setCritereOuObjectif = useSetCritereOuObjectif();
  return (
    <button
      onClick={() => setCritereOuObjectif(critereOuObjectif)}
      type="button"
    >
      <span className="sr-only">En savoir plus</span>
      <Icone icone={InformationPleineIcon} />
    </button>
  );
};
