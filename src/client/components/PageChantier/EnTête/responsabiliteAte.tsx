const saisieAte = (
  <span>
    saisis par les 
    {' '}
    <span className='fr-text--bold'>
      responsables locaux
    </span>
    {' '}
    sous l'autorité des
    {' '}
    <span className='fr-text--bold'>
      Préfets
    </span>
  </span>
);

const saisieHorsAteCentrale = (
  <span>
    saisis par
    {' '}
    <span className='fr-text--bold'>
      l'administration centrale
    </span>
  </span>
);

const saisieHorsAteDeconcentre = (
  <span>
    saisis par les 
    {' '}
    <span className='fr-text--bold'>
      responsables locaux
    </span>
    {' '}
    sous l'autorité de
    {' '}
    <span className='fr-text--bold'>
      l'administration centrale
    </span>
  </span>
);

const mailleAttendu = (mailleAttendue: 'departementale' | 'regionale') => (
  mailleAttendue === 'departementale' ? (
    <span>
      attendus jusqu'à la maille
      {' '}
      <span className='fr-text--bold'>
        départementale
      </span>
    </span>
  ) : (
    <span>
      attendus à la maille
      {' '}
      <span className='fr-text--bold'>
        régionale
      </span>
    </span>
  )
);

export const recupererResponsabiliteTerritoriale = (estChantierRegional: boolean, estChantierDepartemental: boolean, ate: 'ate' | 'hors_ate_centralise' | 'hors_ate_deconcentre' | null) => {
  const listeResponsabiliteTerritoriale = [estChantierRegional ? mailleAttendu('regionale') : estChantierDepartemental ? mailleAttendu('departementale') : null].filter(Boolean);
  
  return ate === 'ate' ? (
    [...listeResponsabiliteTerritoriale, saisieAte]
  ) : ate === 'hors_ate_centralise' ? (
    [...listeResponsabiliteTerritoriale, saisieHorsAteCentrale]
  ) : ate === 'hors_ate_deconcentre' ? (
    [...listeResponsabiliteTerritoriale, saisieHorsAteDeconcentre]
  ) : [];
};
