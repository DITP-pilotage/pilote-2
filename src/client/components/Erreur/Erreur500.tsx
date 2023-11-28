import PageErreur from '@/components/_commons/PageErreur/PageErreur';

export default function Erreur500() {
  return (
    <PageErreur
      message='Nous vous invitons à réessayer plus tard.'
      sousTitre='Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement possible.'
      titre='Erreur inattendue'
    />
  );
}
