import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Link from 'next/link';
import PageUtilisateurProps from '@/components/PageUtilisateur/PageUtilisateur.interface';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import PageUtilisateurStyled from '@/components/PageUtilisateur/PageUtilisateur.styled';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';

export default function PageUtilisateur({ utilisateur }:PageUtilisateurProps) {
  const chemin = [{ nom:'Gestion de Profils', lien:'/admin/utilisateurs' }];

  return (
    <main>
      <PageUtilisateurStyled className='fr-pt-2w fr-pl-15w'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Utilisateur'
        />
        <div className='fiche-utilisateur fr-pl-15v fr-pt-1w fr-pb-13w'>
          <Link
            aria-label="Retour à la liste des utilisateurs"
            className="fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour"
            href='/'
          >
            Retour
          </Link>
          <Titre
            baliseHtml='h1'
            className='fr-h1 fr-mt-4w'
          >
            Fiche profil
          </Titre>
          <Bloc>
            <div className='fr-py-4w fr-px-10w'>
              <Titre
                baliseHtml='h2'
                className='fr-h5'
              >
                Utilisateur
              </Titre>
              <div className='fr-table'>
                <table>
                  <thead>
                    <tr>
                      <th>
                        Adresse email
                      </th>
                      <th>
                        Nom
                      </th>
                      <th>
                        Prénom
                      </th>
                      <th>
                        Profil
                      </th>
                      <th>
                        Dernière modification
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {utilisateur.email}
                      </td>
                      <td>
                        {utilisateur.nom}
                      </td>
                      <td>
                        {utilisateur.prénom}
                      </td>
                      <td>
                        {utilisateur.profil}
                      </td>
                      <td>
                        Non renseigné
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Bloc>
        </div>
      </PageUtilisateurStyled>
    </main>
  );
}
