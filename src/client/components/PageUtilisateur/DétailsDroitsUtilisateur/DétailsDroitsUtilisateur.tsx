import { FunctionComponent, useId } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import DétailsDroitsUtilisateurStyled
  from '@/components/PageUtilisateur/DétailsDroitsUtilisateur/DétailsDroitsUtilisateur.styled';
import AucunÉlément from '@/components/PageUtilisateur/Élément/AucunÉlément';
import ÉlémentAccessible from '@/components/PageUtilisateur/Élément/ÉlémentAccessible';

interface DétailsDroitsUtilisateurProps {
  titre: string
  territoires: string[]
  chantiers: string[]
  labelTerritoires?: string
  labelChantiers?: string
}

const DétailsDroitsUtilisateur: FunctionComponent<DétailsDroitsUtilisateurProps> = ({ titre, territoires, chantiers, labelTerritoires = 'Droits ouverts pour les territoires', labelChantiers = 'Droits ouverts pour les chantiers' }) => {
  const id = useId();

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
            {labelTerritoires}
          </p>
          {
            territoires.length === 0
              ?
                <AucunÉlément />
              :
              territoires.map(territoire => (
                <ÉlémentAccessible
                  key={`${id} ${territoire}`}
                  libellé={territoire}
                />
              ),
              )
          }
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <p className='fr-text--md bold fr-mb-1v'>
            {labelChantiers}
          </p>
          {
            chantiers.length === 0
              ?
                <AucunÉlément />
              :
              chantiers.map(chantier => (
                <ÉlémentAccessible
                  key={`${id} ${chantier}`}
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
};

export default DétailsDroitsUtilisateur;
