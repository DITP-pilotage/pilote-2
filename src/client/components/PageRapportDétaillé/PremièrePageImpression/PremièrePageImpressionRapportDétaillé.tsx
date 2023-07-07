import { formaterDate } from '@/client/utils/date/date';
import PremièrePageImpressionRapportDétailléProps
  from '@/components/PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé.interface';
import { FiltresActifs } from '@/stores/useFiltresStore/useFiltresStore.interface';
import { groupBy } from '@/client/utils/arrays';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import PremièrePageImpressionRapportDétailléStyled from './PremièrePageImpressionRapportDétaillé.styled';

function usePremièrePageImpressionRapportDétaillé(filtresActifs: FiltresActifs, territoireSélectionné: DétailTerritoire | null, périmètresMinistériels: PérimètreMinistériel[]) {
  const tousLesPérimètresGroupés = groupBy(périmètresMinistériels, (p) => p.ministèreNom);
  const filtresPérimètresGroupés = groupBy(filtresActifs.périmètresMinistériels, (p) => p.ministèreNom);
  const ministères = Object.entries(filtresPérimètresGroupés).map(([ministère, filtresPérimètres]) => ({
    nom: ministère,
    périmètres: filtresPérimètres,
    possèdeTousLesPérimètres: filtresPérimètres.length === tousLesPérimètresGroupés[ministère].length,
  }));

  return {
    territoire: territoireSélectionné,
    ministères,
    alertes: filtresActifs.filtresAlerte,
    typologies: filtresActifs.filtresTypologie,
  };
}

export default function PremièrePageImpressionRapportDétaillé({ filtresActifs, territoireSélectionné, périmètresMinistériels }: PremièrePageImpressionRapportDétailléProps) {
  const {
    territoire,
    ministères,
    alertes,
    typologies,
  } = usePremièrePageImpressionRapportDétaillé(filtresActifs, territoireSélectionné, périmètresMinistériels);

  return (
    <PremièrePageImpressionRapportDétailléStyled>
      <header
        className="flex fr-px-12w fr-mb-6w"
        role="banner"
      >
        <p className="fr-logo">
          Gouvernement
        </p>
        <div className="fr-pt-1w fr-ml-5w">
          <p className="fr-text--xl fr-text--bold fr-mb-0">
            PILOTE
          </p>
          <p className="fr-text--sm fr-mb-0">
            Piloter l’action publique par les résultats
          </p>
        </div>
      </header>
      <div className="fr-py-16w fond-bleu-clair">
        <div className="titre-rapport-détaillé fr-display--md texte-centre" >
          État des lieux de l’avancement
          <br />
          des politiques prioritaires
          <br />
          du Gouvernement
        </div>
      </div>
      <div className="fr-px-12w fr-pt-4w">
        <ul className="fr-pl-0 filtres-actifs">
          <li>
            Territoire(s) sélectionné(s)
            <ul>
              <li>
                { territoire?.nomAffiché }
              </li>
            </ul>
          </li>
          <li>
            Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s)
            {
              ministères.length === 0 ? (
                <p className="fr-text--regular fr-text--xl fr-mt-1w">
                  Tous ceux auxquels l&apos;utilisateur est habilité
                </p>
              ) : (
                <ul>
                  {
                    ministères.map(ministère => (
                      <li key={ministère.nom}>
                        {ministère.nom}
                        {
                          !ministère.possèdeTousLesPérimètres &&
                          <ul>
                            {ministère.périmètres.map(périmètre => (
                              <li key={périmètre.id}>
                                {périmètre.nom}
                              </li>
                            ))}
                          </ul>
                        }
                      </li>
                    ))
                  }
                </ul>
              )
            }
          </li>
          {
            typologies.length > 0 &&
            <li>
              Typologie(s) de chantier sélectionné(s)
              <ul>
                {
                  typologies.map(typologie => (
                    <li key={typologie.id}>
                      {typologie.nom}
                    </li>
                  ))
                }
              </ul>
            </li>
          }
          {
            process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && alertes.length > 0 &&
            <li>
              Alerte(s) sélectionnée(s)
              <ul>
                {
                  alertes.map(alerte => (
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
      <div className='fr-px-12w date'>
        {`Rapport détaillé généré le ${formaterDate(new Date().toISOString(), 'DD/MM/YYYY [à] H[h]mm')}`}
      </div>
    </PremièrePageImpressionRapportDétailléStyled>
  );
}
