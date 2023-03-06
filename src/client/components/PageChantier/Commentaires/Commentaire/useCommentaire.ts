/* eslint-disable unicorn/consistent-function-scoping */
export default function useCommentaire() {

  function rendreLeHtml(contenu: string) {
    // ne pas modifier sans une revue de code axée sur la sécurité
    return contenu.replaceAll('\n', '<br/>');
  }

  return {
    rendreLeHtml,
  };
}
