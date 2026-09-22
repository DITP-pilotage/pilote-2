import "vitest";

/**
 * `jest-extended` n'exporte aucun type : son `index.d.ts` déclare les matchers dans une
 * interface `CustomMatchers` non exportée, et le module ne publie qu'une valeur
 * (`export = matchers`). L'ancienne augmentation importait donc un type `Matchers` qui
 * n'existe pas — elle étendait `any`, ce qui laissait passer n'importe quelle propriété.
 * Le défaut est antérieur à vitest 5 : la v4 le masquait, la v5 l'a seulement révélé en
 * resserrant `Assertion`.
 *
 * On passe par le type de la VALEUR exportée, qui est bien `CustomMatchers<any>`, et on
 * aligne l'arité sur celle de vitest 5 — `Assertion` prend désormais le type de résultat
 * avant celui de la valeur testée.
 */
type MatchersJestExtended = typeof import("jest-extended");

declare module "vitest" {
  interface Assertion<R extends void | Promise<void> = void, T = unknown>
    extends MatchersJestExtended {}

  interface AsymmetricMatchersContaining extends MatchersJestExtended {}
}
