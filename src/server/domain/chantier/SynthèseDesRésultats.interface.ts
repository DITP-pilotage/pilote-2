export interface Commentaire {
  contenu: string,
  auteur: string,
  date: string,
}

export default interface SynthèseDesRésultats {
  commentaireSynthèse: Commentaire;
}
