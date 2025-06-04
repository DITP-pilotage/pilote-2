import { FunctionComponent } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import EnteteResponsablesStyled from './EnTêteResponsables.styled';
import { recupererResponsabiliteTerritoriale } from './responsabiliteAte';

interface ResponsableEnTeteElement {
  chantier: Chantier
}

export const ResponsabiliteChantierEnTete: FunctionComponent<ResponsableEnTeteElement> = ({ chantier }) => {
  const estChantierNational = chantier.maillesApplicables.length === 1 && chantier.maillesApplicables.includes('nationale');
  const estChantierDepartemental = chantier.maillesApplicables.length === 2 && chantier.maillesApplicables.includes('departementale') || chantier.maillesApplicables.length === 3;
  const estChantierRegional = chantier.maillesApplicables.length === 2 && chantier.maillesApplicables.includes('regionale');

  let listeResponsabiliteTerritoriale = recupererResponsabiliteTerritoriale(estChantierRegional, estChantierDepartemental, chantier.ate);
  
  return (
    <EnteteResponsablesStyled>
      <div className='flex fr-pl-1v'>
        <div className='icone-entete fr-text-title--blue-france fr-mb-1w fr-pr-3v'>
          <span className='fr-icon-draft-line' />
        </div>
        <div>
          <span className='fr-mb-0 fr-text-title--blue-france fr-text--xs'>
            Chantier piloté 
            {' '}
            {estChantierNational ? 'à la' : "jusqu'à la"}
            {' '}
            <span className='fr-text--bold'>
              maille 
              {' '}
              {estChantierNational ? 'nationale uniquement' : estChantierRegional ? 'régionale' : estChantierDepartemental ? 'départementale' : null}
            </span>
          </span>
          {
            !estChantierNational ? (
              <div>
                <p className='fr-mb-0 fr-text-title--blue-france fr-text--xs fr-text--bold'>
                  Commentaires locaux :
                </p>
                <ul className='fr-mb-0 fr-text-title--blue-france fr-text--xs'>
                  {listeResponsabiliteTerritoriale.map((responsabilite, index) => (
                    <li
                      className='fr-pb-0'
                      key={`responsabilite-${index}`}
                    >
                      {responsabilite}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          }
        </div>
      </div>
    </EnteteResponsablesStyled>
  );
};
