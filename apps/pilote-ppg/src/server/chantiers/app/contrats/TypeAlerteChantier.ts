import { CATEGORIES_ALERTE_CHANTIER } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";

export type TypeAlerteChantier =
  (typeof CATEGORIES_ALERTE_CHANTIER)[number]["typeAlerte"];
