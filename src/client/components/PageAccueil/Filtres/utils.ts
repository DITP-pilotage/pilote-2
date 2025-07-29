import { Maille } from "@/server/domain/maille/Maille.interface";

export const calculerNouvelleMaille = (nouveauFiltre: Maille[]) => {
  if (
    nouveauFiltre.includes("regionale") &&
    !nouveauFiltre.includes("departementale")
  ) {
    return "regionale";
  }
  return "departementale";
};
