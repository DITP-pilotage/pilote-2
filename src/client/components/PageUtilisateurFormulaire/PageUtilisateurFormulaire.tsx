import Link from 'next/link';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import PageUtilisateurFormulaireStyled from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.styled';
import UtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire';
import PageUtilisateurFormulaireProps from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';

export default function PageUtilisateurFormulaire({ chantiers, périmètresMinistériels, profils } :PageUtilisateurFormulaireProps) {

  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];
  const étapes = ['Identifier l\'utilisateur', 'vérifier les droits attribués au compte'];

  return (
    <PageUtilisateurFormulaireStyled className='fr-pt-2w' >
      <main className="fr-container">
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Ajouter un compte'
        />
        <Link
          aria-label="Retour à la liste des utilisateurs"
          className="fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour"
          href='/admin/utilisateurs'
        >
          Retour
        </Link>
        <Titre
          baliseHtml='h1'
          className='fr-h1 fr-mt-4w'
        >
          Créer un compte
        </Titre>
        <Bloc>
          <div className='fr-px-10w fr-py-6w'>

            <IndicateurDEtapes
              étapeCourante={1}
              étapes={étapes}
            />
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
            <UtilisateurFormulaire
              chantiers={chantiers}
              profils={profils}
              périmètresMinistériels={périmètresMinistériels}
            />
          </div>

        </Bloc>
      </main>
    </PageUtilisateurFormulaireStyled>
  );
}
