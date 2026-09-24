import { useId } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";

const TAILLES_DE_PAGE_PAR_DEFAUT = [10, 20, 50];

export function PaginationCompacte({
  numeroDePageCourante,
  nombreDePages,
  tailleDePage,
  taillesDePage = TAILLES_DE_PAGE_PAR_DEFAUT,
  libelleTaillePage = "Lignes par page :",
  changementDePageCallback,
  changementTailleDePageCallback,
}: {
  numeroDePageCourante: number;
  nombreDePages: number;
  tailleDePage: number;
  taillesDePage?: number[];
  libelleTaillePage?: string;
  changementDePageCallback: (numeroDePage: number) => void;
  changementTailleDePageCallback: (tailleDePage: number) => void;
}) {
  const idSelecteurTaillePage = useId();

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <label htmlFor={idSelecteurTaillePage}>{libelleTaillePage}</label>
        <SelecteurNew
          contentClassName="md:!min-w-[var(--radix-select-trigger-width)] !max-w-[var(--radix-select-trigger-width)]"
          htmlName={idSelecteurTaillePage}
          onChange={(taille) => changementTailleDePageCallback(Number(taille))}
          options={taillesDePage.map((taille) => ({
            libelle: String(taille),
            valeur: String(taille),
          }))}
          showSearch={false}
          triggerClassName="w-24"
          valeurSelectionnee={String(tailleDePage)}
        />
      </div>
      <div className="flex items-center gap-3">
        <span>
          Page {numeroDePageCourante} sur {nombreDePages}
        </span>
        <Bouton
          disabled={numeroDePageCourante <= 1}
          label="Précédent"
          onClick={() => changementDePageCallback(numeroDePageCourante - 1)}
          size="sm"
          variant="secondary"
        />
        <Bouton
          disabled={numeroDePageCourante >= nombreDePages}
          label="Suivant"
          onClick={() => changementDePageCallback(numeroDePageCourante + 1)}
          size="sm"
          variant="secondary"
        />
      </div>
    </div>
  );
}
