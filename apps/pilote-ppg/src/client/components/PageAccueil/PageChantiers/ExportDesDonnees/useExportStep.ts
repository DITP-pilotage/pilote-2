import { parseAsBoolean, parseAsInteger, useQueryStates } from "nuqs";

// L'étape et l'ouverture de la modale sont écrites ensemble : écrire l'étape seule
// pouvait réécrire l'URL avant que l'ouverture y soit inscrite, et refermer la modale.
export const useExportStep = () => {
  const [, setExportState] = useQueryStates(
    {
      etapeCourante: parseAsInteger,
      isModaleExportCsvOuverte: parseAsBoolean.withDefault(false),
    },
    { shallow: true, history: "push" },
  );

  const goToStep = (step: number) =>
    setExportState({ etapeCourante: step, isModaleExportCsvOuverte: true });

  return { goToStep };
};
