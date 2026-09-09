import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

// Types mdast minimaux : @types/mdast n'est pas résolvable sous pnpm strict et
// seuls ces nœuds sont manipulés ici.
export type NoeudMarkdown = {
  type: string;
  value?: string;
  url?: string;
  children?: NoeudMarkdown[];
};

export type OptionsLiensChantiers = {
  chantiers: Map<string, ChantierCite>;
  construireUrl: (chantier: ChantierCite) => string;
};

const MOTIF_IDENTIFIANT = /\bch-\d{3,}\b/gi;
const MOTIF_SEPARATEUR = /^\s*[—–-]\s*/u;

const decouperTexte = ({
  valeur,
  chantiers,
  construireUrl,
}: OptionsLiensChantiers & { valeur: string }): NoeudMarkdown[] | null => {
  const noeuds: NoeudMarkdown[] = [];
  let curseur = 0;

  for (const correspondance of valeur.matchAll(MOTIF_IDENTIFIANT)) {
    const debut = correspondance.index;
    if (debut < curseur) continue;

    const chantier = chantiers.get(correspondance[0].toUpperCase());
    if (!chantier) continue;

    let fin = debut + correspondance[0].length;
    const separateur = MOTIF_SEPARATEUR.exec(valeur.slice(fin));
    if (separateur) {
      const apresSeparateur = fin + separateur[0].length;
      if (valeur.startsWith(chantier.nom, apresSeparateur)) {
        fin = apresSeparateur + chantier.nom.length;
      }
    }

    if (debut > curseur) {
      noeuds.push({ type: "text", value: valeur.slice(curseur, debut) });
    }
    noeuds.push({
      type: "link",
      url: construireUrl(chantier),
      children: [{ type: "text", value: valeur.slice(debut, fin) }],
    });
    curseur = fin;
  }

  if (noeuds.length === 0) return null;
  if (curseur < valeur.length) {
    noeuds.push({ type: "text", value: valeur.slice(curseur) });
  }
  return noeuds;
};

const remplacerDansEnfants = (
  noeud: NoeudMarkdown,
  options: OptionsLiensChantiers,
): void => {
  if (!noeud.children) return;

  const enfants: NoeudMarkdown[] = [];
  let modifie = false;

  for (const enfant of noeud.children) {
    if (enfant.type === "link" || enfant.type === "linkReference") {
      enfants.push(enfant);
      continue;
    }

    if (enfant.type === "text" && enfant.value !== undefined) {
      const remplacement = decouperTexte({ ...options, valeur: enfant.value });
      if (remplacement) {
        enfants.push(...remplacement);
        modifie = true;
        continue;
      }
      enfants.push(enfant);
      continue;
    }

    remplacerDansEnfants(enfant, options);
    enfants.push(enfant);
  }

  if (modifie) noeud.children = enfants;
};

export const remarkLiensChantiers =
  (options: OptionsLiensChantiers) =>
  (tree: NoeudMarkdown): void => {
    remplacerDansEnfants(tree, options);
  };
