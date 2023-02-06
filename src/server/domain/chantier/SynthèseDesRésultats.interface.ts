export interface Commentaire {
  contenu: string,
  date: string,
}

export default interface SynthèseDesRésultats {
  commentaireSynthèse: Commentaire;
}
