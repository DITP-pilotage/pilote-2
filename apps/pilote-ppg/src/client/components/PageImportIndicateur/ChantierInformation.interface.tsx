import { Chantier } from "@/shared/chantier/Chantier.interface";

export interface ChantierInformations {
  id: Chantier["id"];
  nom: Chantier["nom"];
  estUnChantierDROM?: boolean;
}
