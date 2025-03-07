export default interface CommentaireRepository {
  anonymiserAuteurs(listeIds: string[], emailAuteurRemplacement: string): Promise<void>;
}
