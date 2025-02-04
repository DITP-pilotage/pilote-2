import { Fragment, FunctionComponent } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import IndicateurPonderation from '@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import api from '@/server/infrastructure/api/trpc/api';
import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import ValeurEtDate from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import IndicateurBlocIndicateurTuile
  from '@/components/_commons/IndicateursChantier/Bloc/indicateurBlocIndicateurTuile';
import ModalePropositionValeurActuelle
  from '@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurActuelle/ModalePropositionValeurActuelle';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurTendance from '@/components/_commons/IndicateursChantier/Bloc/Tendances/IndicateurTendance';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import ModaleSuppressionValeurActuelle
  from '@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurActuelle/ModaleSuppressionValeurActuelle';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';
import useIndicateurAlerteDateMaj from './useIndicateurAlerteDateMaj';

export const ID_HTML_MODALE_SUPPRESSION_VALEUR_ACTUELLE = 'modale-suppression-valeur-actuelle';
export const ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE = 'modale-proposition-valeur-actuelle';

interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  estInteractif: boolean
  chantierEstTerritorialisé: boolean
  estAutoriseAProposerUneValeurActuelle: boolean
  listeSousIndicateurs: Indicateur[]
  territoireCode: string
  territoiresCompares: string[]
  mailleSelectionnee: MailleInterne
  mailleQuery: MailleInterne
  mailsDirecteursProjets: string[]
  jalon: number
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  chantierEstTerritorialisé,
  estAutoriseAProposerUneValeurActuelle = false,
  listeSousIndicateurs,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  mailleQuery,
  mailsDirecteursProjets,
  jalon,
}) => {
  const {
    maille: mailleTerritoireSelectionnee,
  } = territoireCodeVersMailleCodeInsee(territoireCode);
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [, setJalon] = useQueryState('jalon', parseAsStringLiteral(['2024', '2025']).withDefault('2024').withOptions({
    shallow: false,
    history: 'push',
  }));

  const auClickSelecteurJalon = (valeur: '2024' | '2025') => {
    sauvegarderFiltres({ jalon: valeur });
    setJalon(valeur);
  };

  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const detailTerritoiresCompares = territoiresCompares.map(récupérerDétailsSurUnTerritoire);

  const détailTerritoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);

  const détailsIndicateur = détailsIndicateurs[indicateur.id];

  const { data: variableContenuFFPropositionValeurActuelle } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE' });

  const {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
    indicateurNonAJour,
    indicateurEstApplicable,
  } = useIndicateurBloc(détailsIndicateur, territoireCode);

  const informationsIndicateurs = [{
    territoireNom: détailTerritoireSélectionné.nomAffiché,
    code: détailTerritoireSélectionné.code,
    données: détailsIndicateur[territoireCode],
  }];

  const informationsIndicateursComparés = detailTerritoiresCompares.map(territoireCompare => ({
    territoireNom: territoireCompare.nomAffiché,
    code: territoireCompare.code,
    données: détailsIndicateur[territoireCompare.code],
  })).sort((indicateurDétailsTerritoire1, indicateurDétailsTerritoire2) => indicateurDétailsTerritoire1.données.codeInsee.localeCompare(indicateurDétailsTerritoire2.données.codeInsee));

  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(indicateurNonAJour, indicateurEstApplicable);

  const estPropositionSurLeBonJalon = détailsIndicateur[territoireCode].dateValeurActuelleMandat !== null ? new Date(détailsIndicateur[territoireCode].dateValeurActuelleMandat!).getFullYear() <= jalon : false;

  return (
    <IndicateurBlocStyled
      className='fr-mb-2w'
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className='flex justify-between'>
            <div>
              <Titre
                baliseHtml='h4'
                className='fr-text--xl fr-mb-1w'
              >
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
                  ) : null
                }
                {indicateur.nom + (indicateur.unité === null || indicateur.unité === '' ? '' : ` (en ${indicateur.unité})`)}
              </Titre>
              <div className='fr-ml-2w fr-mb-3w'>
                <p className='fr-mb-0 fr-text--xs texte-gris'>
                  Identifiant de l'indicateur :
                  {' '}
                  <strong>
                    {indicateur.id}
                  </strong>
                </p>
                <p className='fr-mb-0 fr-text--xs texte-gris'>
                  Dernière mise à jour des données (de l’indicateur, toutes zones confondues) :
                  {' '}
                  <span className='fr-text--bold'>
                    {dateDeMiseAJourIndicateur ?? 'Non renseignée'}
                  </span>
                </p>
                <div
                  className={`flex align-center relative${estIndicateurEnAlerte ? ' fr-text-warning' : ' texte-gris'}`}
                >
                  <p className='fr-mb-0 fr-text--xs'>
                    Date prévisionnelle de la prochaine mise à jour des données (de l’indicateur) :
                    {' '}
                    <span className='fr-text--bold'>
                      {indicateurEstApplicable ? (dateProchaineDateMaj ?? 'Données requises mais non renseignées par l\'équipe projet') : 'Non renseignée'}
                    </span>
                  </p>
                  <Infobulle
                    className='infobulle-date-previsionnelle'
                    idHtml='infobulle-date-previsionnelle'
                  >
                    <p className='fr-text-title--blue-france'>
                      Date prévisionnelle de mise à jour de l’indicateur :
                    </p>
                    <p>
                      Elle est calculée à partir de la date de la valeur actuelle, de la période de mise à jour et du
                      délai de disponibilité
                      des données. Plus d'informations dans l'accordéon "Description de l’indicateur et calendrier de
                      mise à jour
                    </p>
                  </Infobulle>
                </div>
                <IndicateurPonderation
                  indicateurPondération={détailsIndicateur[territoireCode]?.pondération ?? null}
                  mailleSélectionnée={mailleTerritoireSelectionnee}
                />
              </div>
              {
                détailsIndicateur[territoireCode]?.tendance === 'BAISSE' ? (
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
                <caption className='fr-sr-only'>
                  Un tableau de l'indicateur :'
                </caption>
                <thead className='fr-background-transparent text-center'>
                  <tr>
                    <th className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w' />
                    <th className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm' />
                    <th
                      className='fr-background-contrast-grey border-b-2 text-center fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'
                      colSpan={3}
                    >
                      <div className='flex align-center justify-center'>
                        <span className='fr-pr-1v'>
                          DONNÉES À ÉCHÉANCE
                        </span>
                        <Sélecteur<'2024' | '2025'>
                          htmlName='jalon'
                          options={[{ libellé: '2024', valeur: '2024' }, { libellé: '2025', valeur: '2025' }]}
                          texteFantôme='Sélectionner un jalon'
                          valeurModifiéeCallback={auClickSelecteurJalon}
                          valeurSélectionnée={`${jalon}` as '2024' | '2025'}
                        />
                      </div>
                    </th>
                    <th
                      className='fr-background-action-low-blue-france border-b-2 text-center fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm fr-text--bold'
                      colSpan={3}
                    >
                      DONNÉES À ÉCHÉANCE 2026
                    </th>
                  </tr>
                  <tr className='border-b-2'>
                    <th
                      className='fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      Territoire(s)
                    </th>
                    <th
                      className='fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      valeur initiale
                    </th>
                    <th
                      className='fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      valeur de référence
                    </th>
                    <th
                      className='fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      valeur cible
                    </th>
                    <th
                      className='fr-background-contrast-grey text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      taux d'avancement
                    </th>
                    <th
                      className='fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      valeur actuelle
                    </th>
                    <th
                      className='fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      valeur cible
                    </th>
                    <th
                      className='fr-background-action-low-blue-france text-center fr-mb-0 fr-px-1w fr-py-md-1w fr-text--sm fr-text--bold'
                    >
                      taux d'avancement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {
                  informationsIndicateurs.map(informationIndicateur => {
                    return informationIndicateur.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateur.données est undefined
                      <Fragment key={informationIndicateur.territoireNom}>
                        <tr
                          className={`${informationIndicateur.code === territoireCode ? 'ligne-territoire-proposition-valeur-actuelle' : null}`}
                          key={informationIndicateur.territoireNom}
                        >
                          <td
                            className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text--bold fr-text-title--high-blue-france'
                          >
                            {informationIndicateur.territoireNom}
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurInitiale}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurInitiale}
                            />
                          </td>
                          { /* Valeur et date valeur actuelle de indicateurTerritoireJalon en fonction du jalon */}
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurActuelle}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurActuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
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
                          { /* Valeur et date valeur actuelle mandat de indicateurTerritoire */}
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateur.données.dateValeurActuelleMandat}
                              unité={informationIndicateur.données.unité}
                              valeur={informationIndicateur.données.valeurActuelleMandat}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
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
                        {
                          informationIndicateur.code === territoireCode ? (
                            variableContenuFFPropositionValeurActuelle ? estAutoriseAProposerUneValeurActuelle && informationIndicateur.données.valeurActuelle !== null && informationIndicateur.données.proposition === null ? (
                              <tr
                                className='ligne-creation-proposition-valeur-actuelle'
                              >
                                <td colSpan={8}>
                                  <div className='flex w-full justify-end'>
                                    <button
                                      aria-controls={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                      className='fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-actuelle'
                                      data-fr-opened='false'
                                      type='button'
                                    >
                                      Proposer une autre valeur actuelle
                                    </button>
                                  </div>
                                  <ModalePropositionValeurActuelle
                                    detailIndicateur={informationIndicateur.données}
                                    generatedHTMLID={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                    indicateur={indicateur}
                                    territoireCode={territoireCode}
                                  />
                                </td>
                              </tr>
                            ) : informationIndicateur.données.proposition !== null ? (
                              <>
                                <tr
                                  className='ligne-modification-proposition-valeur-actuelle'
                                  key={informationIndicateur.territoireNom}
                                >
                                  <td className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm'>
                                    <div className='flex align-center'>
                                      <span className='texte-proposition'>
                                        Proposition du territoire
                                      </span>
                                      <Infobulle idHtml='infobulle-proposition-valeur-actuelle'>
                                        <p className='texte-proposition'>
                                          Valeur actuelle proposée
                                          le
                                          {' '}
                                          {formaterDate(informationIndicateur.données.proposition.dateProposition, 'DD/MM/YYYY')}
                                          {' '}
                                          par
                                          {' '}
                                          {informationIndicateur.données.proposition.auteur}
                                        </p>
                                        <p>
                                          <b>
                                            Motif de la proposition
                                          </b>
                                        </p>
                                        <p>
                                          {informationIndicateur.données.proposition.motif}
                                        </p>
                                        <p>
                                          <b>
                                            Source des données et méthode de calcul
                                          </b>
                                        </p>
                                        <p>
                                          {informationIndicateur.données.proposition.sourceDonneeEtMethodeCalcul}
                                        </p>
                                      </Infobulle>
                                    </div>
                                  </td>
                                  <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                                    <ValeurEtDate
                                      date={informationIndicateur.données.dateValeurInitiale}
                                      unité={informationIndicateur.données.unité}
                                      valeur={informationIndicateur.données.valeurInitiale}
                                    />
                                  </td>
                                  {
                                    estPropositionSurLeBonJalon ? (
                                      <>
                                        { /* Valeur actuelle en fonction du jalon et date valeur actuelle en fonction du mandat */}
                                        <td
                                          className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm texte-proposition text-center'
                                        >
                                          <ValeurEtDate
                                            date={informationIndicateur.données.dateValeurActuelleMandat}
                                            unité={informationIndicateur.données.unité}
                                            valeur={informationIndicateur.données.proposition.valeurActuelle}
                                          />
                                        </td>
                                        <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                                          <ValeurEtDate
                                            date={informationIndicateur.données.dateValeurCibleAnnuelle}
                                            unité={informationIndicateur.données.unité}
                                            valeur={informationIndicateur.données.valeurCibleAnnuelle}
                                          />
                                        </td>
                                        <td
                                          className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition'
                                        >
                                          <BarreDeProgression
                                            afficherTexte
                                            fond='gris-clair'
                                            positionTexte='dessus'
                                            taille='md'
                                            valeur={informationIndicateur.données.proposition.tauxAvancementIntermediaire}
                                            variante='jaune-moutarde'
                                          />
                                        </td>
                                      </>
                                    ) : (
                                      <td colSpan={3} />
                                    )
                                  }
                                  { /* Valeur et date valeur actuelle mandat de indicateurTerritoire */}
                                  <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                                    <ValeurEtDate
                                      date={informationIndicateur.données.dateValeurActuelleMandat}
                                      unité={informationIndicateur.données.unité}
                                      valeur={informationIndicateur.données.valeurActuelleMandat}
                                    />
                                  </td>
                                  <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                                    <ValeurEtDate
                                      date={informationIndicateur.données.dateValeurCible}
                                      unité={informationIndicateur.données.unité}
                                      valeur={informationIndicateur.données.valeurCible}
                                    />
                                  </td>
                                  <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm texte-proposition'>
                                    <BarreDeProgression
                                      afficherTexte
                                      fond='gris-clair'
                                      positionTexte='dessus'
                                      taille='md'
                                      valeur={informationIndicateur.données.proposition.tauxAvancement}
                                      variante='jaune-moutarde'
                                    />
                                  </td>
                                </tr>
                                {
                                  estAutoriseAProposerUneValeurActuelle ? (
                                    <tr className='ligne-modification-proposition-valeur-actuelle'>
                                      <td colSpan={8}>
                                        <div className='flex w-full justify-end'>
                                          <button
                                            aria-controls={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                            className='fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-actuelle fr-mr-1w'
                                            data-fr-opened='false'
                                            type='button'
                                          >
                                            Editer la proposition
                                          </button>
                                          <button
                                            aria-controls={ID_HTML_MODALE_SUPPRESSION_VALEUR_ACTUELLE + indicateur.id}
                                            className='fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-actuelle'
                                            data-fr-opened='false'
                                            type='button'
                                          >
                                            Supprimer la proposition
                                          </button>
                                        </div>
                                        <ModalePropositionValeurActuelle
                                          detailIndicateur={informationIndicateur.données}
                                          generatedHTMLID={ID_HTML_MODALE_PROPOSITION_VALEUR_ACTUELLE + indicateur.id}
                                          indicateur={indicateur}
                                          territoireCode={territoireCode}
                                        />
                                        <ModaleSuppressionValeurActuelle
                                          generatedHTMLID={ID_HTML_MODALE_SUPPRESSION_VALEUR_ACTUELLE + indicateur.id}
                                          indicateur={indicateur}
                                          territoireCode={territoireCode}
                                        />
                                      </td>
                                    </tr>
                                  ) : null
                                }
                              </>
                            ) : null : null
                          ) : null
                        }
                      </Fragment>
                    ) : null;
                  })
                }
                  {
                  informationsIndicateursComparés.map(informationIndicateurComparé => {
                    return informationIndicateurComparé.données ? ( // TODO supprimer une fois le refacto fait ! A cause de la react query y'a quelques frames où informationIndicateurComparé.données est undefined
                      <Fragment key={informationIndicateurComparé.territoireNom}>
                        <tr
                          className={`${informationIndicateurComparé.code === territoireCode ? 'ligne-territoire-proposition-valeur-actuelle' : 'table-comparaison-border'}`}
                          key={informationIndicateurComparé.territoireNom}
                        >
                          <td
                            className='fr-mb-0 fr-pl-2w fr-p-1w fr-py-md-1w fr-text--sm fr-text-title--light-blue-france'
                          >
                            {informationIndicateurComparé.territoireNom}
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateurComparé.données.dateValeurInitiale}
                              unité={informationIndicateurComparé.données.unité}
                              valeur={informationIndicateurComparé.données.valeurInitiale}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateurComparé.données.dateValeurActuelle}
                              unité={informationIndicateurComparé.données.unité}
                              valeur={informationIndicateurComparé.données.valeurActuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateurComparé.données.dateValeurCibleAnnuelle}
                              unité={informationIndicateurComparé.données.unité}
                              valeur={informationIndicateurComparé.données.valeurCibleAnnuelle}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                            <BarreDeProgression
                              afficherTexte
                              fond='gris-clair'
                              positionTexte='dessus'
                              taille='md'
                              valeur={informationIndicateurComparé.données.avancement.annuel}
                              variante='secondaire-light'
                            />
                          </td>
                          { /* Valeur et date valeur actuelle mandat de indicateurTerritoire */}
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateurComparé.données.dateValeurActuelleMandat}
                              unité={informationIndicateurComparé.données.unité}
                              valeur={informationIndicateurComparé.données.valeurActuelleMandat}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-py-md-1w fr-text--sm text-center'>
                            <ValeurEtDate
                              date={informationIndicateurComparé.données.dateValeurCible}
                              unité={informationIndicateurComparé.données.unité}
                              valeur={informationIndicateurComparé.données.valeurCible}
                            />
                          </td>
                          <td className='fr-mb-0 fr-p-0 fr-px-2w fr-py-md-1w fr-text--sm'>
                            <BarreDeProgression
                              afficherTexte
                              fond='gris-clair'
                              positionTexte='dessus'
                              taille='md'
                              valeur={informationIndicateurComparé.données.avancement.global}
                              variante='bleu-clair'
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
                indicateur={indicateur}
                indicateurDétailsParTerritoires={informationsIndicateurs}
                indicateurEstAjour={!indicateurNonAJour}
                jalon={jalon}
                listeSousIndicateurs={listeSousIndicateurs}
                mailleQuery={mailleQuery}
                mailleSelectionnee={mailleSelectionnee}
                mailsDirecteursProjets={mailsDirecteursProjets}
                territoireCode={territoireCode}
                territoiresCompares={territoiresCompares}
              />
            ) : null
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
