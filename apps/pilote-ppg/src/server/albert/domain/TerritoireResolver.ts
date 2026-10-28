import type { Perimetre } from "@/server/albert/domain/Perimetre";

export interface TerritoireResolver {
  resoudre(perimetre: Perimetre): Promise<string[]>;
}
