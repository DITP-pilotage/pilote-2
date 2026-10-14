// Bloc cliquable du DSFR (fr-enlarge-link) : le lien qu'il contient s'étend à
// tout le bloc via son ::before.
export const ENLARGE_LINK_CLASSES =
  "relative [&_a]:[background-image:none] [&_a]:[outline-width:0] [&_a]:before:absolute [&_a]:before:inset-0 [&_a]:before:z-[1] [&_a]:before:block [&_a]:before:size-full [&_a]:before:[outline-color:inherit] [&_a]:before:[outline-offset:2px] [&_a]:before:[outline-style:inherit] [&_a]:before:[outline-width:2px] [&_a]:before:content-['']";

// Survol du bloc (variables --hover / --active du cœur), à omettre quand le bloc a son propre fond.
export const ENLARGE_LINK_HOVER_CLASSES =
  "[@media(hover:hover)_and_(pointer:fine)]:hover:[background-color:var(--hover)] [@media(hover:hover)_and_(pointer:fine)]:active:[background-color:var(--active)]";
