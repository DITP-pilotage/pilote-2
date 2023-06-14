import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { useFormContext } from 'react-hook-form';
import InputAvecLabel from '@/components/_commons/InputAvecLabel/InputAvecLabel';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import SaisieDesInformationsUtilisateurProps
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur.interface';
import useSaisieDesInformationsUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/useSaisieDesInformationsUtilisateur';
import Bouton from '@/components/_commons/Bouton/Bouton';

export default function SaisieDesInformationsUtilisateur({ profils, soumissionCallback }: SaisieDesInformationsUtilisateurProps) {
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
      <SubmitBouton label="Suivant" />
  );
}
