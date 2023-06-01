import DétailsDroitsUtilisateurProps
  from '@/components/PageUtilisateur/DétailsDroitsUtilisateur/DétailsDroitsUtilisateur.interface';
import Titre from '@/components/_commons/Titre/Titre';
import DétailsDroitsUtilisateurStyled
  from '@/components/PageUtilisateur/DétailsDroitsUtilisateur/DétailsDroitsUtilisateur.styled';
import AucunÉlément from '@/components/PageUtilisateur/Élément/AucunÉlément';
import ÉlémentAccessible from '@/components/PageUtilisateur/Élément/ÉlémentAccessible';

export default function DétailsDroitsUtilisateur({ titre, territoires, chantiers }: DétailsDroitsUtilisateurProps) {
  return (
    <DétailsDroitsUtilisateurStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h5'
      >
        {titre}
      </Titre>
      <div className='fr-grid-row'>
        <div className='fr-col-12 fr-col-md-6'>
          <p className='fr-text--md bold fr-mb-1v'>
            Droits ouverts pour les territoires
          </p>
          {
            territoires.length === 0
              ?
                <AucunÉlément />
              :
              territoires.map(territoire => (
                <ÉlémentAccessible
                  key={territoire}
                  libellé={territoire}
                />
              ),
              )
          }
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <p className='fr-text--md bold fr-mb-1v'>
            Droits ouverts pour les chantiers
          </p>
          {
            chantiers.length === 0
              ?
                <AucunÉlément />
              :
              chantiers.map(chantier => (
                <ÉlémentAccessible
                  key={chantier}
                  libellé={chantier}
                />
              ),
              )
          }
        </div>
      </div>
      <hr className='fr-hr fr-mt-3w' />
    </DétailsDroitsUtilisateurStyled>
  );
}
