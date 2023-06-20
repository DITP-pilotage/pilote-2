import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { Controller, useFormContext } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import InputAvecLabel from '@/components/_commons/InputAvecLabel/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SaisieDesInformationsUtilisateurProps
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur.interface';
import useSaisieDesInformationsUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Titre from '@/components/_commons/Titre/Titre';

import { UtilisateurFormInputs } from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';
import { Profil } from '@/server/domain/utilisateur/Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default function SaisieDesInformationsUtilisateur({ profils }: SaisieDesInformationsUtilisateurProps) {
  const { listeProfils } = useSaisieDesInformationsUtilisateur(profils);
  const { register, watch, formState: { errors }, control, setValue } = useFormContext<UtilisateurFormInputs>();
  const [habilitationsParDéfaut, setHabilitationsParDéfaut] = useState<HabilitationsÀCréerOuMettreÀJour>({
    lecture: {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
    'saisie.commentaire': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
    'saisie.indicateur': {
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
  });

  const watchProfil = watch('profil');

  const déterminerLesTerritoiresSélectionnésParDéfaut = useCallback((profil: Profil) => {
    if (profil === 'DITP_ADMIN') {
      setHabilitationsParDéfaut(h => ({ ...h, lecture: { territoires: ['NAT-FR'], chantiers: [], périmètres: [] } }));
    }
  }, []);

  useEffect(() => {
    déterminerLesTerritoiresSélectionnésParDéfaut(watchProfil);
  }, [déterminerLesTerritoiresSélectionnésParDéfaut, watchProfil]);

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
        valeurSélectionnée={watch('profil')}
      />
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
      <Controller
        control={control}
        name="habilitations.lecture.territoires"
        render={() => (
          <MultiSelectTerritoire
            changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => setValue('habilitations.lecture.territoires', valeursSélectionnées)}
            territoiresCodesSélectionnésParDéfaut={habilitationsParDéfaut.lecture.territoires}
          />
        )}
        rules={{ required: true }}
      />
      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
        <SubmitBouton
          className='fr-btn--icon-right fr-icon-arrow-right-line'
          label="Suivant"
        />
      </div>
    </>
  );
}
