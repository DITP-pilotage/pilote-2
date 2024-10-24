import { Controller } from 'react-hook-form';
import { FunctionComponent } from 'react';
import InputAvecLabel from '@/components/_commons/InputAvecLabel/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Titre from '@/components/_commons/Titre/Titre';
import MultiSelectTerritoire, {
  MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT,
  MAXIMUM_COMPTES_AUTORISE_PAR_REGION,
} from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import MultiSelectPérimètreMinistériel
  from '@/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import {
  UtilisateurFormulaireProps,
} from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import CaseACocher from '@/components/_commons/CaseACocher/CaseACocher';
import useSaisieDesInformationsUtilisateur from './useSaisieDesInformationsUtilisateur';

const SaisieDesInformationsUtilisateur: FunctionComponent<UtilisateurFormulaireProps> = ({ utilisateur }) => {

  const { 
    register,
    control,
    getValues,
    setValue,
    errors,
    optionsProfil,
    profilCodeSelectionne,
    changementProfilSelectionne,
    afficherChampLectureTerritoires,
    activerLaRestrictionDesTerritoires,
    groupesTerritoiresÀAfficher,
    territoiresSélectionnables,
    changementTerritoiresSelectionnes,
    afficherChampLecturePérimètres,
    changementPerimetresSelectionnes,
    afficherChampLectureChantiers,
    chantiersAccessiblesLecture,
    chantiersIdsAppartenantsAuxPerimetresSelectionnes,
    changementChantiersSelectionnes,
    afficherChampResponsabiliteChantiers,
    chantiersAccessibleResponsabilite,
    afficherChampSaisieIndicateur,
    afficherChampGestionCompte,
    afficherChampSaisieCommentaire,
  } = useSaisieDesInformationsUtilisateur();

  return (
    <>
      <p>
        Il existe trois types de droits : les droits de lecture, les droits de saisie des données et les droits de
        saisie des commentaires. Des droits sont attribués par défaut selon le profil. Pour les profils n’ayant accès
        qu’à certains territoires, chantiers ou projets structurants, il faut spécifier lesquels dans la partie
        “périmètre”. Pour certains profils, les droits de saisie sont facultatifs et à préciser.
      </p>
      <Titre
        baliseHtml='h2'
        className='fr-text--md  fr-mb-2w'
      >
        Identification
      </Titre>
      <p className='fr-text--xs texte-gris fr-mb-4w'>
        Tous les champs sont obligatoires.
      </p>
      <InputAvecLabel
        disabled={Boolean(utilisateur?.email)}
        erreur={errors.email}
        htmlName='email'
        libellé='Adresse électronique'
        register={register('email')}
        texteAide='Format attendu : nom@domaine.fr'
        type='email'
      />
      <InputAvecLabel
        erreur={errors.nom}
        htmlName='nom'
        libellé='Nom'
        register={register('nom')}
      />
      <InputAvecLabel
        erreur={errors.prénom}
        htmlName='prénom'
        libellé='Prénom'
        register={register('prénom')}
      />
      <InputAvecLabel
        erreur={errors.fonction}
        htmlName='fonction'
        libellé='Fonction'
        register={register('fonction')}
      />
      <Sélecteur
        erreur={errors.profil}
        htmlName='profil'
        libellé='Profil'
        options={optionsProfil}
        texteAide='Les droits attribués dépendent du profil sélectionné.'
        texteFantôme='Sélectionner un profil'
        valeurModifiéeCallback={changementProfilSelectionne}
        valeurSélectionnée={profilCodeSelectionne}
      />
      <div
        className={`${(afficherChampLectureTerritoires || afficherChampLecturePérimètres || afficherChampLectureChantiers) ? '' : 'fr-hidden'}`}
      >
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className='fr-text--md  fr-mb-2w'
        >
          Droits de lecture
        </Titre>
        <p className='fr-text--xs texte-gris fr-mb-4w'>
          {
            `Afin de paramétrer l’espace Pilote, merci de préciser le périmètre auquel se rattache le compte. Les options disponibles dépendent du profil indiqué.
             Le nombre d'utilisateurs est limité à ${MAXIMUM_COMPTES_AUTORISE_PAR_DEPARTEMENT} comptes à la maille départementale et ${MAXIMUM_COMPTES_AUTORISE_PAR_REGION} comptes à la maille régionale.`
          }
        </p>
        <div className={`${afficherChampLectureTerritoires ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.lecture.territoires'
              render={() => (
                <MultiSelectTerritoire
                  activerLaRestrictionDesTerritoires={activerLaRestrictionDesTerritoires}
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={changementTerritoiresSelectionnes}
                  groupesÀAfficher={groupesTerritoiresÀAfficher}
                  territoiresCodesSélectionnésParDéfaut={getValues('habilitations.lecture.territoires')}
                  territoiresSélectionnables={territoiresSélectionnables}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
        <div className={`${afficherChampLecturePérimètres ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.lecture.périmètres'
              render={() => (
                <MultiSelectPérimètreMinistériel
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={changementPerimetresSelectionnes}
                  périmètresMinistérielsIdsSélectionnésParDéfaut={getValues('habilitations.lecture.périmètres')}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
        <div className={`${afficherChampLectureChantiers ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.lecture.chantiers'
              render={() => (
                <MultiSelectChantier
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={changementChantiersSelectionnes}
                  chantiers={chantiersAccessiblesLecture ?? []}
                  chantiersIdsSélectionnésParDéfaut={getValues('habilitations.lecture.chantiers')}
                  valeursDésactivées={chantiersIdsAppartenantsAuxPerimetresSelectionnes}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
        <div
          className={`${afficherChampResponsabiliteChantiers ? '' : 'fr-hidden'}`}
        >
          <hr className='fr-hr' />
          <Titre
            baliseHtml='h2'
            className='fr-text--md  fr-mb-2w'
          >
            Responsabilités
          </Titre>
          <p className='fr-text--xs texte-gris fr-mb-4w'>
            Parmi les chantiers autorisés en lecture, merci d'indiquer ceux pour lesquels l'utilisateur a des responsabilités spécifiques (directeur de projet ou responsable local). L'utilisateur apparaîtra nominativement comme directeur de projet ou responsable local de ces chantiers sur les pages des chantiers concernés dans PILOTE
          </p>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.responsabilite.chantiers'
              render={() => (
                <MultiSelectChantier
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={(valeursSélectionnées) => setValue('habilitations.responsabilite.chantiers', valeursSélectionnées)}
                  chantiers={chantiersAccessibleResponsabilite}
                  chantiersIdsSélectionnésParDéfaut={getValues('habilitations.responsabilite.chantiers')}
                  desactive={chantiersAccessibleResponsabilite.length === 0}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
      </div>
      <div className={`${afficherChampSaisieIndicateur ? '' : 'fr-hidden'}`}>
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className='fr-text--md  fr-mb-2w'
        >
          Droits de saisie des données quantitatives
        </Titre>
        <CaseACocher
          libellé='Accorder les droits de saisie des données quantitatives'
          register={register('saisieIndicateur')}
        />
      </div>
      <div className={`${afficherChampSaisieCommentaire ? '' : 'fr-hidden'}`}>
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className='fr-text--md  fr-mb-2w'
        >
          Droits de saisie des commentaires
        </Titre>
        <CaseACocher
          libellé='Accorder les droits de saisie des commentaires'
          register={register('saisieCommentaire')}
        />
      </div>
      <div className={`${afficherChampGestionCompte ? '' : 'fr-hidden'}`}>
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className='fr-text--md  fr-mb-2w'
        >
          Droits de gestion des comptes utilisateurs
        </Titre>
        <CaseACocher
          libellé='Accorder les droits de gestion des comptes utilisateurs'
          register={register('gestionUtilisateur')}
        />
      </div>
      <div className='fr-grid-row fr-grid-row--right fr-mt-4w'>
        <SubmitBouton
          className='fr-btn--icon-right fr-icon-arrow-right-line'
          label='Suivant'
        />
      </div>
    </>
  );
};

export default SaisieDesInformationsUtilisateur;
