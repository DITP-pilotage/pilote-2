import { FeedbackCategorie } from "@/components/_commons/ChatUI/feedbackCategories";
import { clsxm } from "@/utils/clsxm";

export const FeedbackCategorieCard = ({
  categorie,
  selectionnee,
  onToggle,
}: {
  categorie: FeedbackCategorie;
  selectionnee: boolean;
  onToggle: () => void;
}) => {
  const Icone = categorie.icone;
  return (
    <button
      aria-pressed={selectionnee}
      className={clsxm(
        "flex items-start gap-2 rounded-md border p-2 text-left transition-colors",
        selectionnee
          ? "border-dsfr-blue-france-sun-113 bg-dsfr-blue-france-975"
          : "border-gray-300 hover:bg-gray-50",
      )}
      onClick={onToggle}
      type="button"
    >
      <Icone className={clsxm("w-5 h-5 shrink-0", categorie.couleurIcone)} />
      <span className="flex flex-col">
        <span className="font-medium text-sm text-gray-900">
          {categorie.titre}
        </span>
        <span className="text-xs text-gray-500">{categorie.sousTitre}</span>
      </span>
    </button>
  );
};
