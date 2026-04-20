/**
 * Gestion des valeurs composites pour le `SelecteurNew` avec options groupées.
 *
 * **Pourquoi** : le `SelecteurNew` a besoin d'une valeur unique par option pour fonctionner,
 * mais le formulaire stocke séparément le groupe et l'élément dans deux champs distincts.
 *
 * **Cas d'usage** : le sélecteur de service, où les options sont groupées par périmètre ministériel.
 * Le formulaire stocke `perimetreMinisteriel` et `service` dans deux champs séparés.
 *
 * **Exemple concret** :
 * - `buildCompositeValue("education-nationale", "dgesco")` → `"education-nationale--dgesco"`
 * - `parseCompositeValue("education-nationale--dgesco")` → `"dgesco"`
 * - `buildCompositeSelectedValue("education-nationale", "dgesco")` → `"education-nationale--dgesco"`
 * - `buildCompositeSelectedValue(null, "dgesco")` → `undefined` (valeur invalide si groupe manquant)
 */

const COMPOSITE_SEPARATOR = "--";

export function buildCompositeValue(
  groupValue: string,
  itemValue: string,
): string {
  return `${groupValue}${COMPOSITE_SEPARATOR}${itemValue}`;
}

export function parseCompositeValue(compositeValue: string): string {
  return compositeValue.includes(COMPOSITE_SEPARATOR)
    ? compositeValue
        .split(COMPOSITE_SEPARATOR)
        .slice(1)
        .join(COMPOSITE_SEPARATOR)
    : compositeValue;
}

export function buildCompositeSelectedValue(
  groupValue: string | null,
  itemValue: string | null,
): string | undefined {
  return groupValue && itemValue
    ? buildCompositeValue(groupValue, itemValue)
    : undefined;
}
