import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { useFormContext } from 'react-hook-form';
import InputAvecLabel from '@/components/_commons/InputAvecLabel/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SaisieDesInformationsUtilisateurProps
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur.interface';
import useSaisieDesInformationsUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import Titre from '@/components/_commons/Titre/Titre';
import MultiSelect from '@/components/_commons/MultiSelect/MultiSelect';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';

export default function SaisieDesInformationsUtilisateur({ profils }: SaisieDesInformationsUtilisateurProps) {
  const { listeProfils } = useSaisieDesInformationsUtilisateur(profils);
  const { register, watch, formState: { errors: erreurs } } = useFormContext();
  
  return (
    <>
      <p>
        Il existe trois types de droits : les droits de lecture, les droits de saisie des données et les droits de saisie des commentaires. Des droits sont attribués par défaut selon le profil. Pour les profils n’ayant accès qu’à certains territoires, chantiers ou projets structurants, il faut spécifier lesquels dans la partie “périmètre”. Pour certains profils, les droits de saisie sont facultatifs et à préciser.
      </p>
      <section className="fr-accordion fr-mb-6w">
        <h3 className="fr-accordion__title">
          <button
            aria-controls="accordion-profils"
            aria-expanded="false"
            className="fr-accordion__btn"
            type='button'
          >
            Voir la liste des profils et les droits associés
          </button>
        </h3>
        <div
          className="fr-collapse"
          id="accordion-profils"
        />
      </section>
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
        erreur={erreurs.email}
        htmlName="email"
        libellé="Adresse électronique"
        register={register('email')}
        texteAide="Format attendu : nom@domaine.fr"
        type='email'
      />
      <InputAvecLabel
        erreur={erreurs.nom}
        htmlName="nom"
        libellé="Nom"
        register={register('nom')}
      />
      <InputAvecLabel
        erreur={erreurs.prénom}
        htmlName="prénom"
        libellé="Prénom"
        register={register('prénom')}
      />
      <InputAvecLabel
        erreur={erreurs.fonction}
        htmlName="fonction"
        libellé="Fonction"
        register={register('fonction')}
      />
      <Sélecteur
        erreur={erreurs.profil}
        htmlName='profil'
        libellé='Profil'
        options={listeProfils}
        register={register('profil')}
        texteAide='Les droits attribués dépendent du profil sélectionné. Vous pouvez consulter la correspondance entre profils et droits ci-dessus.\n'
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
      <SubmitBouton label="Suivant" />
      <MultiSelectTerritoire />
    </>
  );
}
