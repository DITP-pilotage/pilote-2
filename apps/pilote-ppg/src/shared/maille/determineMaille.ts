import { Maille } from "./Maille.interface";

export function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "nationale";
  if (territoireCode.startsWith("REG")) return "regionale";
  return "departementale";
}
