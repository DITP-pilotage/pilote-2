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
import useSaisieDesInformationsUtilisateurSaisieIndicateurs from './useSaisieDesInformationsUtilisateurSaisieIndicateurs';
import useSaisieDesInformationsUtilisateurSaisieCommentaire from './useSaisieDesInformationsUtilisateurSaisieCommentaires';


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
    chantiersSynthétisésSélectionnés,
    périmètresIdSélectionnablesSaisie,
  } = useSaisieDesInformationsUtilisateur(utilisateur);

  const {
    handleChangementValeursSélectionnéesChantiersSaisieIndicateurs,
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs,
    afficherChampSaisieIndicateursChantiers,
    afficherChampSaisieIndicateursPérimètres,
    chantiersSaisieIndicateursSélectionnés,
    périmètresMinistérielsSaisieIndicateursSélectionnés,    
  } = useSaisieDesInformationsUtilisateurSaisieIndicateurs(profilSélectionné, chantiersSynthétisésSélectionnés, utilisateur);

  const {
    handleChangementValeursSélectionnéesTerritoiresSaisieCommentaire,
    handleChangementValeursSélectionnéesChantiersSaisieCommentaire,
    handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieCommentaire,
    chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire,
    afficherChampSaisieCommentaireTerritoires,
    afficherChampSaisieCommentaireChantiers,
    afficherChampSaisieCommentairePérimètres,
    territoiresSélectionnésSaisieCommentaire,
    chantiersSélectionnésSaisieCommentaire,
    périmètresMinistérielsSélectionnésSaisieCommentaire,
    chantiersAccessiblesPourLeProfilSaisieCommentaire,
  } = useSaisieDesInformationsUtilisateurSaisieCommentaire(profilSélectionné, chantiersSynthétisésSélectionnés, utilisateur);

  return (
    <>
      <p>
        Il existe trois types de droits : les droits de lecture, les droits de saisie des données et les droits de saisie des commentaires. Des droits sont attribués par défaut selon le profil. Pour les profils n’ayant accès qu’à certains territoires, chantiers ou projets structurants, il faut spécifier lesquels dans la partie “périmètre”. Pour certains profils, les droits de saisie sont facultatifs et à préciser.
      </p>
      <Titre
        baliseHtml='h2'
        className="fr-text--md  fr-mb-2w"
      >
        Identification
      </Titre>
      <p className="fr-text--xs texte-gris fr-mb-4w">
        Tous les champs sont obligatoires.
      </p>
      <InputAvecLabel
        disabled={Boolean(utilisateur?.email)}
        erreur={errors.email}
        htmlName="email"
        libellé="Adresse électronique"
        register={register('email', { value: utilisateur?.email })}
        texteAide="Format attendu : nom@domaine.fr"
        type='email' 
      />
      <InputAvecLabel
        erreur={errors.nom}
        htmlName="nom"
        libellé="Nom"
        register={register('nom', { value: utilisateur?.nom })} 
      />
      <InputAvecLabel
        erreur={errors.prénom}
        htmlName="prénom"
        libellé="Prénom"
        register={register('prénom', { value: utilisateur?.prénom })} 
      />
      <InputAvecLabel
        erreur={errors.fonction}
        htmlName="fonction"
        libellé="Fonction"
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
          className="fr-text--md  fr-mb-2w"
        >
          Droits de lecture
        </Titre>
        <p className="fr-text--xs texte-gris fr-mb-4w">
          Afin de paramétrer l’espace Pilote, merci de préciser le périmètre auquel se rattache le compte. Les options disponibles dépendent du profil indiqué.
        </p>
        <div className={`${!!afficherChampLectureTerritoires ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name="habilitations.lecture.territoires"
              render={() => (
                <MultiSelectTerritoire
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesTerritoires}
                  groupesÀAfficher={groupesTerritoiresÀAfficher}
                  territoiresCodesSélectionnésParDéfaut={territoiresSélectionnés}
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
              name="habilitations.lecture.périmètres"
              render={() => (
                <MultiSelectPérimètreMinistériel
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
              name="habilitations.lecture.chantiers"
              render={() => (
                <MultiSelectChantier
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
      <div className={`${(!!afficherChampSaisieIndicateursChantiers || !!afficherChampSaisieIndicateursPérimètres) ? '' : 'fr-hidden'}`}>
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className="fr-text--md  fr-mb-2w"
        >
          Droits de saisie des données quantitatives
        </Titre>
        <p className="fr-text--xs texte-gris fr-mb-4w">
          Précisez les droits de saisie rattachés au compte. Les options disponibles dépendent du profil et des droits de lecture précédemment indiqués.
        </p>
        <div className={`${!!afficherChampSaisieIndicateursPérimètres ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name="habilitations.saisie.indicateur.périmètres"
              render={() => (
                <MultiSelectPérimètreMinistériel
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieIndicateurs}
                  périmètresId={périmètresIdSélectionnablesSaisie}
                  périmètresMinistérielsIdsSélectionnésParDéfaut={périmètresMinistérielsSaisieIndicateursSélectionnés}
                />
              )}
              rules={{ required: true }} 
            />
          </div>
        </div>
        <div className={`${!!afficherChampSaisieIndicateursChantiers ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name="habilitations.saisie.indicateur.chantiers"
              render={() => (
                <MultiSelectChantier
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesChantiersSaisieIndicateurs}
                  chantiers={chantiersSynthétisésSélectionnés}
                  chantiersIdsSélectionnésParDéfaut={chantiersSaisieIndicateursSélectionnés}
                  valeursDésactivées={chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieIndicateurs} 
                />
              )}
              rules={{ required: true }} 
            />
          </div>
        </div>
      </div>
      <div className={`${(!!afficherChampSaisieCommentaireTerritoires || !!afficherChampSaisieCommentairePérimètres || !!afficherChampSaisieCommentaireChantiers) ? '' : 'fr-hidden'}`}>
        <hr className='fr-hr' />
        <Titre
          baliseHtml='h2'
          className="fr-text--md  fr-mb-2w"
        >
          Droits de saisie des commentaires
        </Titre>
        <p className="fr-text--xs texte-gris fr-mb-4w">
          Précisez les droits de saisie rattachés au compte. Les options disponibles dépendent du profil et des droits de lecture précédemment indiqués.         
        </p>
        <div className={`${!!afficherChampSaisieCommentaireTerritoires ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name="habilitations.saisie.commentaire.territoires"
              render={() => (
                <MultiSelectTerritoire
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesTerritoiresSaisieCommentaire}
                  groupesÀAfficher={groupesTerritoiresÀAfficher}
                  territoiresCodesSélectionnésParDéfaut={territoiresSélectionnésSaisieCommentaire}
                  territoiresSélectionnables={territoiresSélectionnés}
                />
              )}
              rules={{ required: true }} 
            />
          </div>
        </div>
        <div className={`${!!afficherChampSaisieCommentairePérimètres ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name="habilitations.saisie.commentaire.périmètres"
              render={() => (
                <MultiSelectPérimètreMinistériel
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesPérimètresMinistérielsSaisieCommentaire}
                  périmètresId={périmètresIdSélectionnablesSaisie}
                  périmètresMinistérielsIdsSélectionnésParDéfaut={périmètresMinistérielsSélectionnésSaisieCommentaire} 
                />
              )}
              rules={{ required: true }} 
            />
          </div>
        </div>
        <div className={`${!!afficherChampSaisieCommentairePérimètres ? '' : 'fr-hidden'}`}>
          <div className='fr-mb-4w'>
            <Controller
              control={control}
              name="habilitations.saisie.commentaire.chantiers"
              render={() => (
                <MultiSelectChantier
                  changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesChantiersSaisieCommentaire}
                  chantiers={chantiersAccessiblesPourLeProfilSaisieCommentaire}
                  chantiersIdsSélectionnésParDéfaut={chantiersSélectionnésSaisieCommentaire}
                  valeursDésactivées={chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnésSaisieCommentaire} 
                />
              )}
              rules={{ required: true }}
            />
          </div>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
        <SubmitBouton
          className='fr-btn--icon-right fr-icon-arrow-right-line'
          label="Suivant" 
        />
      </div>
      {/* <DevTool control={control} /> */}
    </>
  );
}
