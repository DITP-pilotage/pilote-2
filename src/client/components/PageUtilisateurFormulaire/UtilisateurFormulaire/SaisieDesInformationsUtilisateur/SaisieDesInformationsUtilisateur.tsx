import { Controller } from 'react-hook-form';
import InputAvecLabel from '@/components/_commons/InputAvecLabel/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import useSaisieDesInformationsUtilisateur from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Titre from '@/components/_commons/Titre/Titre';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import MultiSelectPérimètreMinistériel from '@/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import { UtilisateurFormulaireProps } from '@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import CaseACocher from '@/components/_commons/CaseACocher/CaseACocher';
// import { DevTool } from '@hookform/devtools';


export default function SaisieDesInformationsUtilisateur({ utilisateur }: UtilisateurFormulaireProps) {
  const {
    listeProfils, 
    profilSélectionné,
    handleChangementValeursSélectionnéesTerritoires, 
    handleChangementValeursSélectionnéesChantiers, 
    handleChangementValeursSélectionnéesPérimètresMinistériels, 
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés, 
    register, 
    errors, 
    control, 
    afficherChampLectureTerritoires, 
    afficherChampLectureChantiers, 
    afficherChampLecturePérimètres, 
    territoiresSélectionnés, 
    chantiersSélectionnés, 
    périmètresMinistérielsSélectionnés, 
    groupesTerritoiresÀAfficher, 
    chantiersAccessiblesPourLeProfil,
    afficherChampSaisieCommentaire,
    afficherChampSaisieIndicateur,
    afficherChampGestionCompte,
    session,
  } = useSaisieDesInformationsUtilisateur(utilisateur);  

  return (
    <>
      <p>
        Il existe trois types de droits : les droits de lecture, les droits de saisie des données et les droits de saisie des commentaires. Des droits sont attribués par défaut selon le profil. Pour les profils n’ayant accès qu’à certains territoires, chantiers ou projets structurants, il faut spécifier lesquels dans la partie “périmètre”. Pour certains profils, les droits de saisie sont facultatifs et à préciser.
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
        register={register('email', { value: utilisateur?.email })}
        texteAide='Format attendu : nom@domaine.fr'
        type='email' 
      />
      <InputAvecLabel
        erreur={errors.nom}
        htmlName='nom'
        libellé='Nom'
        register={register('nom', { value: utilisateur?.nom })} 
      />
      <InputAvecLabel
        erreur={errors.prénom}
        htmlName='prénom'
        libellé='Prénom'
        register={register('prénom', { value: utilisateur?.prénom })} 
      />
      <InputAvecLabel
        erreur={errors.fonction}
        htmlName='fonction'
        libellé='Fonction'
        register={register('fonction', { value: utilisateur?.fonction })} 
      />
      <Sélecteur
        erreur={errors.profil}
        htmlName='profil'
        libellé='Profil'
        options={listeProfils}
        register={register('profil', { value: utilisateur?.profil })}
        texteAide='Les droits attribués dépendent du profil sélectionné.'
        texteFantôme='Sélectionner un profil'
        valeurSélectionnée={profilSélectionné?.code} 
      />
      <div className={`${(!!afficherChampLectureTerritoires || !!afficherChampLecturePérimètres || !!afficherChampLectureChantiers) ? '' : 'fr-hidden'}`}>
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className='fr-text--md  fr-mb-2w'
        >
          Droits de lecture
        </Titre>
        <p className='fr-text--xs texte-gris fr-mb-4w'>
          Afin de paramétrer l’espace Pilote, merci de préciser le périmètre auquel se rattache le compte. Les options disponibles dépendent du profil indiqué.
        </p>
        <div className={`${!!afficherChampLectureTerritoires ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.lecture.territoires'
              render={() => (
                <MultiSelectTerritoire
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesTerritoires}
                  groupesÀAfficher={groupesTerritoiresÀAfficher}
                  territoiresCodesSélectionnésParDéfaut={territoiresSélectionnés}
                  territoiresSélectionnables={session?.habilitations['utilisateurs.modification'].territoires}
                />
              )}
              rules={{ required: true }} 
            />
          </div>
        </div>
        <div className={`${!!afficherChampLecturePérimètres ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.lecture.périmètres'
              render={() => (
                <MultiSelectPérimètreMinistériel
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesPérimètresMinistériels}
                  périmètresMinistérielsIdsSélectionnésParDéfaut={périmètresMinistérielsSélectionnés} 
                />
              )}
              rules={{ required: true }} 
            />
          </div>
        </div>
        <div className={`${!!afficherChampLecturePérimètres ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name='habilitations.lecture.chantiers'
              render={() => (
                <MultiSelectChantier
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesChantiers}
                  chantiers={chantiersAccessiblesPourLeProfil}
                  chantiersIdsSélectionnésParDéfaut={chantiersSélectionnés}
                  valeursDésactivées={chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés}
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
      </div>
      <div className={`${!!afficherChampSaisieIndicateur ? '' : 'fr-hidden'}`}>
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
      <div className={`${!!afficherChampSaisieCommentaire ? '' : 'fr-hidden'}`}>
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
      <div className={`${!!afficherChampGestionCompte ? '' : 'fr-hidden'}`}>
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
      {/* <DevTool control={control} /> */}
    </>
  );
}
