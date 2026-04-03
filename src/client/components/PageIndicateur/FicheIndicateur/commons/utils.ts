import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";

export const computeValeurAffichee = (
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  indicateur: MetadataParametrageIndicateurContrat,
  name: keyof MetadataParametrageIndicateurContrat,
): string => {
  const rawValue = indicateur[name];

  const editBoxType =
    informationMetadataIndicateur.dataType === "boolean"
      ? "boolean"
      : informationMetadataIndicateur.metaPiloteEditBoxType;

  switch (editBoxType) {
    case "boolean":
      return rawValue ? "Oui" : "Non";
    case "multi-select": {
      const found = informationMetadataIndicateur.acceptedValues.find(
        (acceptedValue) => acceptedValue.valeur === rawValue,
      );
      return found?.libellé || "_";
    }
    case "text":
    case "textarea":
    default: {
      if (rawValue == null) {
        return "_";
      }

      if (typeof rawValue === "string" && rawValue.trim() === "") {
        return "_";
      }

      return `${rawValue}`;
    }
  }
};

export const computeListeValeur = (
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
): { valeur: string; libellé: string }[] => {
  return informationMetadataIndicateur.acceptedValues.map((acceptedValue) => ({
    valeur: acceptedValue.valeur,
    libellé: acceptedValue.libellé,
  }));
};
