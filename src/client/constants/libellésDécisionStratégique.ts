import { TypeDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";

export const libellésTypesDécisionStratégique: Record<
  TypeDecisionStrategique,
  string
> = {
  suiviDesDécisionsStratégiques: "Suivi des décisions stratégiques",
};

export const consignesEcritureDecisionStrategique: Record<
  TypeDecisionStrategique,
  string
> = {
  suiviDesDécisionsStratégiques:
    "Notez les décisions prises lors des réunions Elysée <> Matignon et indiquez les actions envisagées et/ou réalisées pour mettre en œuvre ou répondre à ces décisions.",
};
