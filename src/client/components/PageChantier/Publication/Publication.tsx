import { useMemo } from 'react';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import PublicationProps from './Publication.interface';

export default function Publication({ contenu, auteur, date, messageSiAucunContenu }: PublicationProps) {
  const dateFormattée = useMemo(() => formaterDate(date, 'jj/mm/aaaa'), [date]);
  const doitAfficherDate = useMemo(() => dateFormattée !== null, [dateFormattée]);
  const doitAfficherAuteur = useMemo(() => (auteur !== null && auteur.trim() !== '') ?? false, [auteur]);
  const doitÊtreAffiché = useMemo(() => (contenu !== null && contenu.trim() !== '') ?? false, [contenu]);

  if (!doitÊtreAffiché) {
    return (
      <p className="fr-text--sm texte-gris">
        {messageSiAucunContenu}
      </p>
    );
  }

  return (
    <>
      {
        doitAfficherAuteur || doitAfficherDate ? (
          <p className="fr-text--xs texte-gris fr-mb-1w">
            { doitAfficherDate && doitAfficherAuteur ? `Mis à jour le ${dateFormattée} | par ${auteur}` : null }
            { doitAfficherDate && !doitAfficherAuteur ? `Mis à jour le ${dateFormattée}` : null }
            { !doitAfficherDate && doitAfficherAuteur ? `Par ${auteur}` : null }
          </p>
        ) : null
      }
      {
      contenu ? (
        <p
          className="fr-text--sm fr-mb-0"
        // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenu),
          }}
        />
      ) : null
    }
    </>
  );
}
