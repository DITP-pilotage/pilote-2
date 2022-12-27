type Élément = {
  nom: string | null,
  ancre: string | null,
};

export type Éléments = (Élément & { sousÉléments: Élément[] })[];
