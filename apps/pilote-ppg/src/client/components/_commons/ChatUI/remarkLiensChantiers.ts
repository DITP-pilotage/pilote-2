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

// Un modèle openweight ne s'en tient pas au trait d'union ASCII : il produit
// couramment U+2011 dans l'identifiant (« CH\u2011173 ») et un tiret cadratin
// précédé d'une espace fine insécable devant le nom. On accepte toute la
// famille des tirets Unicode, et l'URL est construite depuis l'identifiant
// canonique, jamais depuis la graphie rencontrée.
const TIRETS = "-\u2010\u2011\u2012\u2013\u2014\u2212";
const MOTIF_IDENTIFIANT = new RegExp(`\\bch[${TIRETS}](\\d{3,})\\b`, "gi");
const MOTIF_SEPARATEUR = new RegExp(`^\\s*[${TIRETS}]\\s*`, "u");

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

    const chantier = chantiers.get(`CH-${correspondance[1]}`);
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
