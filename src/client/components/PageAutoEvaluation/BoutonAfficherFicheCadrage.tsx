import { CritereOuObjectif } from "@/components/Evaluation/FicheCadrage";
import { useSetCritereOuObjectif } from "@/components/Evaluation/LayoutFicheCadrage";
import { Icone } from "@/components/_commons/Icone";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { Bouton } from "@/client/components/_commons/Bouton/Bouton";
import { Pencil1Icon } from "@/client/components/_commons/Icones/Pencil1Icon";

export const BoutonAfficherFicheCadrage = ({
  critereOuObjectif,
}: {
  critereOuObjectif: CritereOuObjectif;
}) => {
  const setCritereOuObjectif = useSetCritereOuObjectif();
  if (critereOuObjectif.type === "critere") {
    return (
      <button
        onClick={() => setCritereOuObjectif(critereOuObjectif)}
        type="button"
      >
        <span className="sr-only">En savoir plus</span>
        <Icone icone={InformationPleineIcon} />
      </button>
    );
  }

  return (
    <Bouton
      className="items-center !text-sm"
      iconLeft={<Pencil1Icon className="h-4 w-4" />}
      label="Editer la fiche de cadrage"
      onClick={() => setCritereOuObjectif(critereOuObjectif)}
      type="button"
      variant="link"
    />
  );
};
