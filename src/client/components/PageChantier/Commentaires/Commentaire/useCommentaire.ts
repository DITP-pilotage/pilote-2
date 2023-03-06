/* eslint-disable unicorn/consistent-function-scoping */
import DOMPurify from 'isomorphic-dompurify';

export default function useCommentaire() {

  function rendreLeHtml(contenuDuCommentaire: string) {
    // ne pas modifier sans une revue de code axée sur la sécurité
    const contenuDuCommentaireHtml = contenuDuCommentaire.replaceAll('\n', '<br/>');
    return DOMPurify.sanitize(contenuDuCommentaireHtml);
  }

  return {
    rendreLeHtml,
  };
}
