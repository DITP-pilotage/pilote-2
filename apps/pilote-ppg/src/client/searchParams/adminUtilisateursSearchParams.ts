import { z } from "zod";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import {
  PAGE_INDEX_DEFAUT,
  TAILLE_DEFAUT_PAGINATION_UTILISATEUR,
} from "@/client/constants/constantes";
import { profilsCodes } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

const sortingArraySchema = z.array(
  z.object({ id: z.string(), desc: z.boolean() }),
);

export const loadAdminUtilisateursSearchParams = createLoader({
  chantiers: parseAsArrayOf(parseAsString).withDefault([]),
  territoires: parseAsArrayOf(parseAsString).withDefault([]),
  perimetresMinisteriels: parseAsArrayOf(parseAsString).withDefault([]),
  profils: parseAsArrayOf(parseAsStringLiteral([...profilsCodes])).withDefault(
    [],
  ),
  typeCompte: parseAsArrayOf(
    parseAsStringLiteral(["actif", "desactive"]),
  ).withDefault(["actif", "desactive"]),
  pageIndex: parseAsInteger.withDefault(PAGE_INDEX_DEFAUT),
  pageSize: parseAsInteger.withDefault(TAILLE_DEFAUT_PAGINATION_UTILISATEUR),
  sort: parseAsJson(sortingArraySchema.parse).withDefault([
    { id: "Dernière modification", desc: true },
  ]),
  q: parseAsString.withDefault(""),
});
