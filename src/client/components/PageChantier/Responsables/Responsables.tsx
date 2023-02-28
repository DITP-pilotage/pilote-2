import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import ResponsablesStyled from './Responsables.styled';
import ResponsablesProps from './Responsables.interface';
import ResponsablesLigne from './ResponsablesLigne/ResponsablesLigne';

const mailTo = (label: string, mail: string | null) => (
  mail ?
    <a href={`mailto:${mail}`}>
      {label}
    </a>
    : label
);

export default function Responsables({ chantier }: ResponsablesProps) {
  const responsables = chantier.responsables;
   
  return (
    <ResponsablesStyled id="responsables">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Responsables
      </Titre>
      <Bloc titre="National">
        <div className="fr-mt-3w">
          <ResponsablesLigne
            contenu={[responsables.porteur]}
            libellé="Ministère porteur"
          />
          <hr className='fr-hr' />
          <ResponsablesLigne
            contenu={responsables.coporteurs.map(coporteur => coporteur)}
            libellé="Autres ministères co-porteurs"
          />
          <hr className='fr-hr' />
          <ResponsablesLigne
            contenu={responsables.directeursAdminCentrale.map(directeur => (`${directeur.nom} (${directeur.direction})`))}
            libellé="Directeur(s) / directrice(s) d’Administration Centrale"
          />
          <hr className='fr-hr' />
          <ResponsablesLigne
            contenu={responsables.directeursProjet.map(directeur => (mailTo(directeur.nom, directeur.email)))}
            libellé="Directeur(s) / directrice(s) du projet"
          />
        </div>
      </Bloc>
    </ResponsablesStyled>
  );
}
