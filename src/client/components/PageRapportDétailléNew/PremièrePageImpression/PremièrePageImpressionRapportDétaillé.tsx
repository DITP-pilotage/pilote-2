import { formaterDate } from '@/client/utils/date/date';
import PremièrePageImpressionRapportDétailléProps
  from '@/components/PageRapportDétailléNew/PremièrePageImpression/PremièrePageImpressionRapportDétaillé.interface';
import { groupBy } from '@/client/utils/arrays';
import PremièrePageImpressionRapportDétailléStyled from './PremièrePageImpressionRapportDétaillé.styled';

export default function PremièrePageImpressionRapportDétaillé({
  filtresActifs,
  territoireSélectionné,
  ministères,
}: PremièrePageImpressionRapportDétailléProps) {
  const filtresPérimètresGroupés = groupBy(filtresActifs.périmètresMinistériels, (p) => p.ministèreNom);
  const filtresActifsMinistères = Object.entries(filtresPérimètresGroupés).map(([ministère, filtresPérimètres]) => ({
    nom: ministère,
    périmètresMinistériels: filtresPérimètres,
  }));

  const ministèresÀAfficher = filtresActifsMinistères.length > 0 ? filtresActifsMinistères : ministères;

  return (
    <PremièrePageImpressionRapportDétailléStyled>
      <header
        className='flex fr-px-12w fr-mb-6w'
        role='banner'
      >
        <p className='fr-logo'>
          Gouvernement
        </p>
        <div className='fr-pt-1w fr-ml-5w'>
          <p className='fr-text--xl fr-text--bold fr-mb-0'>
            PILOTE
          </p>
          <p className='fr-text--sm fr-mb-0'>
            Piloter l’action publique par les résultats
          </p>
        </div>
      </header>
      <div className='fr-pt-6w fr-pb-3w fond-bleu-clair'>
        <div className='fr-mb-6w fr-display--md texte-centre titre-rapport-détaillé'>
          État des lieux de l’avancement
          <br />
          des politiques prioritaires
          <br />
          du Gouvernement
        </div>
        <div className='fr-px-12w'>
          {`Rapport détaillé généré le ${formaterDate(new Date().toISOString(), 'DD/MM/YYYY [à] H[h]mm')}`}
        </div>
      </div>
      <div className='fr-px-12w fr-py-4w filtres-actifs-conteneur'>
        <ul className='fr-pl-0 filtres-actifs'>
          <li>
            <span className='fr-text--bold'>
              Territoire sélectionné
            </span>
            <ul>
              <li>
                {territoireSélectionné?.nomAffiché}
              </li>
            </ul>
          </li>
          {
            ministèresÀAfficher.length > 0 &&
            <li>
              <span className='fr-text--bold'>
                Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s)
              </span>
              <ul>
                {
                  ministèresÀAfficher.map(ministère => (
                    <li key={ministère.nom}>
                      <span className='fr-text--bold'>
                        {ministère.nom}
                      </span>
                      <ul>
                        {ministère.périmètresMinistériels.map(périmètre => (
                          <li key={périmètre.id}>
                            {périmètre.nom}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))
                }
              </ul>
            </li>
          }
          {
            filtresActifs.filtresTypologie.length > 0 &&
            <li>
              <span className='fr-text--bold'>
                Type(s) de chantier sélectionné(s)
              </span>
              <ul>
                {
                  filtresActifs.filtresTypologie.map(typologie => (
                    <li key={typologie.id}>
                      {typologie.nom}
                    </li>
                  ))
                }
              </ul>
            </li>
          }
          {
            process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && filtresActifs.filtresAlerte.length > 0 &&
            <li>
              <span className='fr-text--bold'>
                Alerte(s) sélectionnée(s)
              </span>
              <ul>
                {
                  filtresActifs.filtresAlerte.map(alerte => (
                    <li key={alerte.id}>
                      {alerte.nom}
                    </li>
                  ))
                }
              </ul>
            </li>
          }
        </ul>
      </div>
    </PremièrePageImpressionRapportDétailléStyled>
  );
}
