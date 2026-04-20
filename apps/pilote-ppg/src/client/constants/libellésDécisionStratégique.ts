import { TypeDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";

export const libellésTypesDécisionStratégique: Record<
  TypeDecisionStrategique,
  string
> = {
  suiviDesDecisionsStrategiques: "Suivi des décisions stratégiques",
};

export const complementsConsigneGeneriqueDecisionStrategique: Record<
  TypeDecisionStrategique,
  string
> = {
  suiviDesDecisionsStrategiques: "au suivi des décisions stratégiques",
};

export const consignesEcritureDecisionStrategique: Record<
  TypeDecisionStrategique,
  string
> = {
  suiviDesDecisionsStrategiques:
    "Notez les décisions prises lors des réunions Elysée <> Matignon et indiquez les actions envisagées et/ou réalisées pour mettre en œuvre ou répondre à ces décisions.",
};
