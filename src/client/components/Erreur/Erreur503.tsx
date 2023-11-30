import PageErreur from '@/components/_commons/PageErreur/PageErreur';

export default function Erreur500() {
  return (
    <PageErreur
      message='Nous vous invitons à réessayer plus tard.'
      sousTitre='PILOTE n’est actuellement pas accessible. Nous vous prions de bien vouloir nous excuser pour la gêne occasionnée.'
      titre='Application indisponible'
    />
  );
}
