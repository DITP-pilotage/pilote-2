import { z } from "zod";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
} from "nuqs/server";
import {
  PAGE_INDEX_DEFAUT,
  TAILLE_DEFAUT_PAGINATION_UTILISATEUR,
} from "@/client/constants/constantes";

const sortingArraySchema = z.array(
  z.object({ id: z.string(), desc: z.boolean() }),
);

export const loadAdminUtilisateursSearchParams = createLoader({
  chantiers: parseAsArrayOf(parseAsString).withDefault([]),
  territoires: parseAsArrayOf(parseAsString).withDefault([]),
  perimetresMinisteriels: parseAsArrayOf(parseAsString).withDefault([]),
  profils: parseAsArrayOf(parseAsString).withDefault([]),
  typeCompte: parseAsArrayOf(parseAsString).withDefault(["actif", "desactive"]),
  pageIndex: parseAsInteger.withDefault(PAGE_INDEX_DEFAUT),
  pageSize: parseAsInteger.withDefault(TAILLE_DEFAUT_PAGINATION_UTILISATEUR),
  sort: parseAsJson(sortingArraySchema.parse).withDefault([
    { id: "Dernière modification", desc: true },
  ]),
  q: parseAsString.withDefault(""),
});
