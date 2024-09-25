import { Fragment, FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import IndicateurPonderation from '@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import PictoSousIndicateur from '@/components/_commons/PictoSousIndicateur/PictoSousIndicateur';
import useIndicateurAlerteDateMaj from '@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj';
import IndicateurTendance from '@/components/_commons/IndicateursChantier/Bloc/Tendances/IndicateurTendance';
import '@gouvfr/dsfr/dist/utility/colors/colors.css';
import IndicateurBlocIndicateurTuile
  from '@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile';
import ValeurEtDate from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import useSousIndicateurBloc from './useSousIndicateurBloc';
import SousIndicateurBlocStyled from './SousIndicateurBloc.styled';

interface SousIndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  estInteractif: boolean
  chantierEstTerritorialisé: boolean
  classeCouleurFond: string
  territoireCode: string
  territoiresCompares: string[]
  mailleSelectionnee: MailleInterne
  mailsDirecteursProjets: string[]
}

const SousIndicateurBloc: FunctionComponent<SousIndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  chantierEstTerritorialisé,
  classeCouleurFond,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  mailsDirecteursProjets,
}) => {
  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const {
    codeInsee: codeInseeTerritoireSelectionne,
  } = territoireCodeVersMailleCodeInsee(territoireCode);

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const detailTerritoiresCompares = territoiresCompares.map(récupérerDétailsSurUnTerritoire);
  const detailTerritoireSelectionne = récupérerDétailsSurUnTerritoire(territoireCode);

  const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');

  const informationsIndicateurs = (
    detailTerritoiresCompares.length > 0 ? detailTerritoiresCompares.map(territoireCompare => ({
      territoireNom: territoireCompare.nomAffiché,
      données: détailsIndicateur[territoireCompare.codeInsee],
    })) : [{
      territoireNom: detailTerritoireSelectionne.nomAffiché,
      données: détailsIndicateur[codeInseeTerritoireSelectionne],
    }]
  ).sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) => indicateurDétailsTerritoire1.données.codeInsee.localeCompare(indicateurDétailsTerritoire2.données.codeInsee));

  const {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
    indicateurNonAJour,
    indicateurEstApplicable,
  } = useSousIndicateurBloc(détailsIndicateur, territoireCode);

  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(indicateurNonAJour, indicateurEstApplicable);

  return (
    <SousIndicateurBlocStyled
      className={`fr-pt-1w ${classeCouleurFond}`}
      key={indicateur.id}
    >
      <section>
        <div className='flex justify-between'>
          <div>
            <Titre
              baliseHtml='h4'
              className='fr-text--xl fr-mb-1w fr-ml-1w'
            >
              <span className='fr-mr-1v'>
                <PictoSousIndicateur />
              </span>
              {
                estIndicateurEnAlerte ? (
                  <span className='fr-mr-1v'>
                    <BadgeIcône type='warning' />
                  </span>
                ) : null
              }
              {
                indicateur.estIndicateurDuBaromètre ? (
                  <span className='fr-mr-1v'>
                    <PictoBaromètre />
                  </span>
                )
                  : null
              }
              {indicateur.nom + (indicateur.unité === null || indicateur.unité === '' ? '' : ` (en ${indicateur.unité?.toLocaleLowerCase()})`)}
            </Titre>
            <div className='fr-ml-2w fr-mb-3w'>
              <p className='fr-mb-0 fr-text--xs texte-gris'>
                Dernière mise à jour des données (de l’indicateur, toutes zones confondues) :
                {' '}
                <span className='fr-text--bold'>
                  {dateDeMiseAJourIndicateur ?? 'Non renseignée'}
                </span>
              </p>
              <p
                className={`fr-mb-0 fr-text--xs${estIndicateurEnAlerte ? ' fr-text-warning' : ''}`}
              >
                Date prévisionnelle de la prochaine date de mise à jour des données (de l'indicateur) :
                {' '}
                <span className='fr-text--bold'>
                  {indicateurEstApplicable ? (dateProchaineDateMaj ?? 'Données requises mais non renseignées par l\'équipe projet') : 'Non renseignée'}
                </span>
              </p>
              <IndicateurPonderation
                indicateurPondération={détailsIndicateur[codeInsee]?.pondération ?? null}
                mailleSélectionnée={maille}
              />
            </div>
            {
              détailsIndicateur[codeInsee].tendance === 'BAISSE' ? (
                <IndicateurTendance />
              ) : null
            }
          </div>
        </div>
        {
          estVueTuile ? (
            informationsIndicateurs.map(informationIndicateur => (
              <Fragment key={informationIndicateur.territoireNom}>
                <IndicateurBlocIndicateurTuile
                  indicateurDétailsParTerritoire={informationIndicateur}
                  typeDeRéforme='chantier'
                  unité={informationIndicateur.données.unité}
                />
              </Fragment>
            ))
          ) : (
            <table className='fr-table w-full border-collapse fr-mb-0'>
              <thead className='fr-background-action-low-blue-france'>
                <tr>
                  <th className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold'>
                    Territoire(s)
                  </th>
                  <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                    Valeur initiale
                  </th>
                  <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                    Valeur actuelle
                  </th>
                  <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                    Cible 2024
                  </th>
                  <th className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm fr-text--bold'>
                    {'Avancement ' + new Date().getFullYear().toString()}
                  </th>
                  <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'>
                    Cible 2026
                  </th>
                  <th className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm fr-text--bold'>
                    Avancement 2026
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                informationsIndicateurs.map(informationIndicateur => {
                  return informationIndicateur.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateur.données est undefined
                    <Fragment key={informationIndicateur.territoireNom}>
                      <tr key={informationIndicateur.territoireNom}>
                        <td className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm'>
                          {informationIndicateur.territoireNom}
                        </td>
                        <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                          <ValeurEtDate
                            date={informationIndicateur.données.dateValeurInitiale}
                            unité={informationIndicateur.données.unité}
                            valeur={informationIndicateur.données.valeurInitiale}
                          />
                        </td>
                        <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                          <ValeurEtDate
                            date={informationIndicateur.données.dateValeurActuelle}
                            unité={informationIndicateur.données.unité}
                            valeur={informationIndicateur.données.valeurActuelle}
                          />
                        </td>
                        <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                          <ValeurEtDate
                            date={informationIndicateur.données.dateValeurCibleAnnuelle}
                            unité={informationIndicateur.données.unité}
                            valeur={informationIndicateur.données.valeurCibleAnnuelle}
                          />
                        </td>
                        <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                          <BarreDeProgression
                            afficherTexte
                            fond='gris-clair'
                            positionTexte='dessus'
                            taille='md'
                            valeur={informationIndicateur.données.avancement.annuel}
                            variante='secondaire'
                          />
                        </td>
                        <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm'>
                          <ValeurEtDate
                            date={informationIndicateur.données.dateValeurCible}
                            unité={informationIndicateur.données.unité}
                            valeur={informationIndicateur.données.valeurCible}
                          />
                        </td>
                        <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                          <BarreDeProgression
                            afficherTexte
                            fond='gris-clair'
                            positionTexte='dessus'
                            taille='md'
                            valeur={informationIndicateur.données.avancement.global}
                            variante='primaire'
                          />
                        </td>
                      </tr>
                    </Fragment>
                  ) : null;
                })
              }
              </tbody>
            </table>
          )
        }
        {
          estInteractif ? (
            <IndicateurDétails
              chantierEstTerritorialisé={chantierEstTerritorialisé}
              dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
              dateProchaineDateMaj={dateProchaineDateMaj}
              dateProchaineDateValeurActuelle={dateProchaineDateValeurActuelle}
              dateValeurActuelle={dateValeurActuelle}
              detailsIndicateursTerritoire={detailsIndicateursTerritoire}
              détailsIndicateurs={détailsIndicateurs}
              estSousIndicateur
              indicateur={indicateur}
              indicateurDétailsParTerritoires={informationsIndicateurs}
              indicateurEstAjour={!indicateurNonAJour}
              listeSousIndicateurs={[]}
              mailleSelectionnee={mailleSelectionnee}
              mailsDirecteursProjets={mailsDirecteursProjets}
              territoireCode={territoireCode}
              territoiresCompares={territoiresCompares}
            />
          ) : null
        }
      </section>
    </SousIndicateurBlocStyled>
  );
};

export default SousIndicateurBloc;
