import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { ChantierRapportDetailleWithoutMailles } from "@/server/rapport-detaille/rapportDetaille.interface";

export function withoutMailles(
  chantier: ChantierRapportDetailleContrat,
): ChantierRapportDetailleWithoutMailles {
  const { mailles: _mailles, ...reste } = chantier;
  return reste;
}
