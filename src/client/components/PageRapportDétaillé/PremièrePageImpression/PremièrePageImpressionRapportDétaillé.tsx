import PremièrePageImpressionRapportDétailléStyled from './PremièrePageImpressionRapportDétaillé.styled';

const date = new Date();

export default function PremièrePageImpressionRapportDétaillé() {
  return (
    <PremièrePageImpressionRapportDétailléStyled>
      <header
        className="fr-header"
        role="banner"
      >
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br />
                      Française
                    </p>
                  </div>
                </div>
                <div className="fr-header__service">
                  <p className="fr-header__service-title">
                    PILOTE
                  </p>
                  <p className="fr-header__service-tagline fr-hidden fr-unhidden-sm">
                    Piloter les politiques publiques par leurs impacts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="titre-rapport-détaillé fr-display--xl fr-mt-12w" >
        Pilote
      </div>
      <hr className='fr-hr fr-mt-4w fr-mb-6w' />
      <div className="sous-titre-rapport-détaillé fr-display--xl" >
        Rapport détaillé
      </div>
      <p className='date'>
        {`Rapport détaillé généré le ${date.toLocaleDateString()} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} `}
      </p>
    </PremièrePageImpressionRapportDétailléStyled>
  );
}
