import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { TAILLE_DEFAUT_PAGINATION_UTILISATEUR } from "@/client/constants/constantes";
import {
  parseAsSorting,
  parseAsTablePage,
} from "@/components/shared/DataTable/urlParsers";
import { profilsCodes } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

export const TYPES_COMPTE = ["actif", "desactive"] as const;

export const adminUtilisateursFilterParsers = {
  territoires: parseAsArrayOf(parseAsString).withDefault([]),
  perimetresMinisteriels: parseAsArrayOf(parseAsString).withDefault([]),
  chantiers: parseAsArrayOf(parseAsString).withDefault([]),
  profils: parseAsArrayOf(parseAsStringLiteral([...profilsCodes])).withDefault(
    [],
  ),
  typeCompte: parseAsArrayOf(parseAsStringLiteral(TYPES_COMPTE)).withDefault([
    ...TYPES_COMPTE,
  ]),
};

export const adminUtilisateursSearchParams = {
  ...adminUtilisateursFilterParsers,
  page: parseAsTablePage,
  pageSize: parseAsInteger.withDefault(TAILLE_DEFAUT_PAGINATION_UTILISATEUR),
  sort: parseAsSorting.withDefault([
    { id: "Dernière modification", desc: true },
  ]),
  q: parseAsString.withDefault(""),
};

export const loadAdminUtilisateursSearchParams = createLoader(
  adminUtilisateursSearchParams,
);
