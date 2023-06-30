import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { Controller } from 'react-hook-form';
//import { DevTool } from '@hookform/devtools';  
import InputAvecLabel from '@/components/_commons/InputAvecLabel/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SaisieDesInformationsUtilisateurProps from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur.interface';
import useSaisieDesInformationsUtilisateur from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Titre from '@/components/_commons/Titre/Titre';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import MultiSelectPérimètreMinistériel from '@/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import useHabilitationsTerritoires from './useHabilitationsTerritoires';
import useHabilitationsChantiers from './useHabilitationsChantiers';
import useHabilitationsPérimètresMinistériels from './useHabilitationsPérimètresMinistériels';

export default function SaisieDesInformationsUtilisateur({ profils }: SaisieDesInformationsUtilisateurProps) {
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
    watch,
  } = useSaisieDesInformationsUtilisateur(profils);

  const {    
    masquerLeChampLectureTerritoire,
    groupesÀAfficher,
  } = useHabilitationsTerritoires(profilSélectionné);

  const {    
    masquerLeChampLectureChantiers,
    chantiersAccessiblesPourLeProfil,
  } = useHabilitationsChantiers(profilSélectionné);

  const {
    masquerLeChampLecturePérimètresMinistériels,
  } = useHabilitationsPérimètresMinistériels(profilSélectionné);


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
        erreur={errors.email}
        htmlName="email"
        libellé="Adresse électronique"
        register={register('email')}
        texteAide="Format attendu : nom@domaine.fr"
        type='email'
      />
      <InputAvecLabel
        erreur={errors.nom}
        htmlName="nom"
        libellé="Nom"
        register={register('nom')}
      />
      <InputAvecLabel
        erreur={errors.prénom}
        htmlName="prénom"
        libellé="Prénom"
        register={register('prénom')}
      />
      <InputAvecLabel
        erreur={errors.fonction}
        htmlName="fonction"
        libellé="Fonction"
        register={register('fonction')}
      />
      <Sélecteur
        erreur={errors.profil}
        htmlName='profil'
        libellé='Profil'
        options={listeProfils}
        register={register('profil')}
        texteAide='Les droits attribués dépendent du profil sélectionné.'
        texteFantôme='Sélectionner un profil'
        valeurSélectionnée={profilSélectionné?.code}
      />
      <div className={masquerLeChampLectureTerritoire && masquerLeChampLectureChantiers ? 'fr-hidden' : ''}>
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
        <div className={masquerLeChampLectureTerritoire ? 'fr-hidden' : 'fr-mb-4w'}>
          <Controller
            control={control}
            name="habilitations.lecture.territoires"
            render={() => (
              <MultiSelectTerritoire
                changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesTerritoires}
                groupesÀAfficher={groupesÀAfficher}
                territoiresCodesSélectionnésParDéfaut={watch('habilitations.lecture.territoires')}
              />
            )}
            rules={{ required: true }}
          />
        </div>
        <div className={masquerLeChampLecturePérimètresMinistériels ? 'fr-hidden' : 'fr-mb-4w'}>
          <Controller
            control={control}
            name="habilitations.lecture.périmètres"
            render={() => (
              <MultiSelectPérimètreMinistériel
                changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesPérimètresMinistériels} 
                périmètresMinistérielsIdsSélectionnésParDéfaut={watch('habilitations.lecture.périmètres')}
              />
            )}
            rules={{ required: true }}
          />
        </div>
        <div className={masquerLeChampLectureChantiers ? 'fr-hidden' : 'fr-mb-4w'}>
          <Controller
            control={control}
            name="habilitations.lecture.chantiers"
            render={() => (
              <MultiSelectChantier 
                changementValeursSélectionnéesCallback={handleChangementValeursSélectionnéesChantiers} 
                chantiers={chantiersAccessiblesPourLeProfil}
                chantiersIdsSélectionnésParDéfaut={watch('habilitations.lecture.chantiers')}
                valeursDésactivées={chantiersIdsAppartenantsAuPérimètresMinistérielsSélectionnés}
              />
            )}
            rules={{ required: true }}
          />
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
