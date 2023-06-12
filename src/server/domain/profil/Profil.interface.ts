export type Profil = {
  code: string,
  nom: string,
  aAccesTousChantiers: boolean,
  aAccesTousChantiersTerritorialises: boolean,
  aAccesTousLesTerritoiresLecture: boolean,
  aAccesTousLesTerritoiresSaisieCommentaire: boolean,
  aAccesTousLesTerritoiresSaisieIndicateur: boolean,
  peutConsulterLesUtilisateurs: boolean,
  peutModifierLesUtilisateurs: boolean,
  peutSupprimerLesUtilisateurs: boolean
};
