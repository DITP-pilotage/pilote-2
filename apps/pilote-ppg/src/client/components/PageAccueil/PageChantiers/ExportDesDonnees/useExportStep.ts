import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export const TYPES_EXPORT = [
  "chantiers",
  "indicateurs",
  "historique-indicateurs",
] as const;

// Chaque écriture des paramètres de l'export inscrit aussi l'ouverture de la
// modale : une écriture partielle pouvait réécrire l'URL avant que l'ouverture
// y soit inscrite, et refermer la modale.
export const useExportStep = () => {
  const [exportState, setExportState] = useQueryStates(
    {
      etapeCourante: parseAsInteger,
      typeExport: parseAsStringLiteral(TYPES_EXPORT).withDefault("chantiers"),
      optionsExport: parseAsString.withDefault("identifiant"),
      isAvecFiltre: parseAsBoolean.withDefault(false),
      isModaleExportCsvOuverte: parseAsBoolean.withDefault(false),
    },
    { shallow: true },
  );

  const updateExport = (
    values: Partial<{
      typeExport: (typeof TYPES_EXPORT)[number];
      optionsExport: string;
      isAvecFiltre: boolean;
    }>,
  ) => setExportState({ ...values, isModaleExportCsvOuverte: true });

  const goToStep = (step: number) =>
    setExportState(
      { etapeCourante: step, isModaleExportCsvOuverte: true },
      { history: "push" },
    );

  return { exportState, updateExport, goToStep };
};
