import type { MarkdownNode } from "@/components/_commons/ChatUI/remarkChantierLinks";

const BR = /^<br\s*\/?>$/i;

const remplacer = (node: MarkdownNode): void => {
  if (!node.children) return;
  node.children = node.children.map((child) =>
    child.type === "html" && BR.test(child.value?.trim() ?? "")
      ? { type: "break" }
      : child,
  );
  node.children.forEach(remplacer);
};

/**
 * Le modèle écrit souvent `<br>` pour aller à la ligne, surtout dans une
 * cellule de tableau, où le markdown n'a pas d'autre moyen. Le HTML n'est pas
 * interprété : seuls ces `<br>` deviennent de vrais retours à la ligne.
 */
export const remarkSautsDeLigne =
  () =>
  (tree: MarkdownNode): void => {
    remplacer(tree);
  };
