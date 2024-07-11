import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { formaterDate } from '@/client/utils/date/date';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import PremièrePageImpressionRapportDétailléStyled from './PremièrePageImpressionRapportDétaillé.styled';

interface PremièrePageImpressionRapportDétailléProps {
  territoireSélectionné: DétailTerritoire | null,
  estAutoriseAVoirLesBrouillons: boolean,
  ministères: Ministère[],
  axes: Axe[],
}

const PremièrePageImpressionRapportDétaillé = ({
  estAutoriseAVoirLesBrouillons,
  territoireSélectionné,
  ministères,
  axes,
}: PremièrePageImpressionRapportDétailléProps) => {
  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    brouillon: parseAsBoolean.withDefault(true),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
  });

  const listePerimetres = ministères.flatMap(ministère => ministère.périmètresMinistériels);

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [ministère.id, ministère.périmètresMinistériels[0].id]),
  );

  const retrouverNomFiltre = (idItemRecherche: string, listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[]) => {
    return listItems.find(item => item.id === idItemRecherche)!.nom;
  };

  const perimetreActif = filtres.perimetres.split(',').filter(Boolean);

  const ministereAvecPerimetreActif = ministères.reduce((acc, ministere) => {
    if (ministèresAvecUnSeulPérimètre.has(ministere.id) && perimetreActif.includes(ministèresAvecUnSeulPérimètre.get(ministere.id) || '')) {
      acc.set(ministere.id, { nom: ministere.nom, perimetres: [{ id: ministere.id, nom: ministere.nom }] });
    } else {
      perimetreActif.forEach(perimetre => {
        if (ministere.périmètresMinistériels.map(périmètresMinistériel => périmètresMinistériel.id).includes(perimetre)) {
          acc.set(ministere.id, {
            nom: ministere.nom,
            perimetres: [...(acc.get(ministere.id)?.perimetres || []), {
              id: perimetre,
              nom: retrouverNomFiltre(perimetre, listePerimetres),
            }],
          });
        }
      });
    }
    return acc;
  }, new Map<string, { nom: string, perimetres: { id: string, nom: string }[] }>);
  const filtresTypologie = [
    filtres.estBarometre ? 'Chantiers du baromètre' : null,
    filtres.estTerritorialise ? 'Chantiers territorialisés' : null,
    estAutoriseAVoirLesBrouillons ? filtres.brouillon ? 'Chantiers validés et en cours de publication' : 'Chantiers validés uniquement' : null,
  ].filter(Boolean);
  const filtresAlertes = [
    filtres.estEnAlerteTauxAvancementNonCalculé ? 'Taux d’avancement non calculé en raison d’indicateurs non renseignés' : null,
    filtres.estEnAlerteÉcart ? `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${territoireSélectionné?.maille}` : null,
    filtres.estEnAlerteBaisse ? 'Chantier(s) avec tendance en baisse' : null,
    filtres.estEnAlerteMétéoNonRenseignée ? 'Chantier(s) avec météo et synthèse des résultats non renseignés' : null,
    filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? 'Chantier(s) sans taux d’avancement au niveau départemental' : null,
  ].filter(Boolean);

  const filtresAxes = filtres.axes.split(',').filter(Boolean).map(axeId => retrouverNomFiltre(axeId, axes));

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
            [...ministereAvecPerimetreActif].length > 0 ? (
              <li>
                <span className='fr-text--bold'>
                  Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s)
                </span>
                <ul>
                  {
                    [...ministereAvecPerimetreActif].map(([, ministère]) => {
                      return (
                        <li key={ministère.nom}>
                          <span className='fr-text--bold'>
                            {ministère.nom}
                          </span>
                          <ul>
                            {ministère.perimetres.map(périmètre => (
                              <li key={périmètre.id}>
                                {périmètre.nom}
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })
                  }
                </ul>
              </li>
            ) : null
          }
          {
            filtresTypologie.length > 0 &&
            <li>
              <span className='fr-text--bold'>
                Type(s) de chantier sélectionné(s)
              </span>
              <ul>
                {
                  filtresTypologie.map(typologie => (
                    <li key={typologie}>
                      {typologie}
                    </li>
                  ))
                }
              </ul>
            </li>
          }
          {
            filtresAxes.length > 0 &&
            <li>
              <span className='fr-text--bold'>
                Axe(s)
              </span>
              <ul>
                {
                  filtresAxes.map(axe => (
                    <li key={axe}>
                      {axe}
                    </li>
                  ))
                }
              </ul>
            </li>
          }
          {
            process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && filtresAlertes.length > 0 &&
            <li>
              <span className='fr-text--bold'>
                Alerte(s) sélectionnée(s)
              </span>
              <ul>
                {
                  filtresAlertes.map(alerte => (
                    <li key={alerte}>
                      {alerte}
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
};

export default PremièrePageImpressionRapportDétaillé;
