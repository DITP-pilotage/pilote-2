import "@gouvfr/dsfr/dist/component/table/table.min.css";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FunctionComponent } from "react";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import PageUtilisateurStyled from "@/components/PageUtilisateur/PageUtilisateur.styled";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import FicheUtilisateur from "@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import Modale from "@/client/components/_commons/Modale/Modale";
import { Bouton } from "@/client/components/_commons/Bouton/Bouton";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import { useGestionTokenAPI } from "@/components/PageAdminGestionTokenAPI/useGestionTokenAPI";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import { TokenAPIInformationContrat } from "@/server/authentification/app/contrats/TokenAPIInformationContrat";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";
import usePageUtilisateur from "./usePageUtilisateur";

interface PageUtilisateurProps {
  utilisateur: Utilisateur;
  tokenAPIInformation: TokenAPIInformationContrat;
}

const PageUtilisateur: FunctionComponent<PageUtilisateurProps> = ({
  utilisateur,
  tokenAPIInformation,
}) => {
  const {
    desactiverUtilisateur,
    fermerLaModaleDeDesactivationUtilisateur,
    modificationEstImpossible,
    donnneContenuBandeau,
    habilitationsAGenererUnTokenDAuthentification,
    vérifierFFTokenAPIEstDisponible,
    reactiverUtilisateur,
    fermerLaModaleDeReactivationUtilisateur,
  } = usePageUtilisateur(utilisateur);
  const chemin = [{ nom: "Gestion des comptes", lien: "/admin/utilisateurs" }];
  const { data: session } = useSession();
  const { creerTokenAPI, alerte } = useGestionTokenAPI();

  return (
    <PageUtilisateurStyled className="fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Utilisateur" />
        <div className="fiche-utilisateur fr-pt-1w fr-pb-13w">
          <div className="flex">
            <Link
              aria-label="Retour à l'accueil"
              className="flex items-center gap-2 !text-primary"
              href="/admin/utilisateurs"
            >
              <Icone className="w-4 h-4" icone={ArrowLine3Icon} />
              Retour
            </Link>
          </div>
          <Titre baliseHtml="h1" className="fr-h1 fr-mt-4w">
            Fiche du compte
          </Titre>
          <Bloc>
            <div className="fr-py-4w fr-px-10w">
              {modificationEstImpossible(
                session,
                utilisateur.habilitations,
                utilisateur.profil,
              ) && (
                <div className="fr-pb-4w">
                  <BandeauInformation bandeauType="INFO" fermable={false}>
                    {donnneContenuBandeau(
                      session,
                      utilisateur.habilitations,
                      utilisateur.profil,
                    )}
                  </BandeauInformation>
                </div>
              )}
              <FicheUtilisateur utilisateur={utilisateur} />
              {!utilisateur.dateDesactivation &&
                !modificationEstImpossible(
                  session,
                  utilisateur.habilitations,
                  utilisateur.profil,
                ) && (
                  <div className="fr-grid-row fr-mt-4w">
                    <Link
                      className="fr-btn fr-mr-2w"
                      href={`/admin/utilisateur/${utilisateur.id}/modifier`}
                    >
                      Modifier
                    </Link>
                    {vérifierFFTokenAPIEstDisponible &&
                    habilitationsAGenererUnTokenDAuthentification(
                      // @ts-expect-error session est forcément not null içi
                      session,
                      utilisateur.profil,
                    ) ? (
                      <button
                        className="fr-btn fr-btn--secondary fr-mr-2w"
                        onClick={() =>
                          creerTokenAPI({ email: utilisateur.email })
                        }
                        title="Générer un token d'authentification"
                        type="submit"
                      >
                        Générer un token d'authentification
                      </button>
                    ) : null}
                    <button
                      aria-controls="desactiver-compte"
                      className="fr-text desactiver"
                      data-fr-opened={false}
                      type="button"
                    >
                      Désactiver le compte
                    </button>
                    {alerte ? (
                      <div className="fr-my-2w">
                        <Alerte
                          message={alerte.message}
                          titre={alerte.titre}
                          type={alerte.type}
                        />
                      </div>
                    ) : null}
                    {tokenAPIInformation ? (
                      <div className="fr-alert fr-alert--info fr-alert--sm fr-mt-2w">
                        <p className="fr-text--sm">
                          Information : Un token est déjà actif pour cet
                          utilisateur. La génération d'un nouveau token
                          supprimera ce token actif.
                        </p>
                      </div>
                    ) : null}
                    <Modale
                      idHtml="desactiver-compte"
                      titre="Désactivation de compte"
                    >
                      <div>
                        Vous êtes sur le point de désactiver le compte de{" "}
                        <span className="uppercase">{utilisateur.prénom}</span>{" "}
                        <span className="uppercase">{utilisateur.nom}.</span>
                      </div>
                      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
                        <Bouton
                          className="fr-btn--secondary fr-mr-2w"
                          label="Annuler"
                          onClick={fermerLaModaleDeDesactivationUtilisateur}
                        />
                        <Bouton
                          label="Confirmer la désactivation"
                          onClick={desactiverUtilisateur}
                        />
                      </div>
                    </Modale>
                  </div>
                )}
              {!!utilisateur.dateDesactivation &&
                !modificationEstImpossible(
                  session,
                  utilisateur.habilitations,
                  utilisateur.profil,
                ) && (
                  <div className="fr-grid-row fr-mt-4w">
                    <button
                      aria-controls="reactiver-compte"
                      className="fr-btn"
                      data-fr-opened={false}
                      type="button"
                    >
                      Réactiver le compte
                    </button>
                    <Modale
                      idHtml="reactiver-compte"
                      titre="Réactivation de compte"
                    >
                      <div>
                        Vous êtes sur le point de réactiver le compte de{" "}
                        <span className="uppercase">{utilisateur.prénom}</span>{" "}
                        <span className="uppercase">{utilisateur.nom}.</span> Un
                        message de réinitialisation de mot de passe lui sera
                        transmis automatiquement.
                      </div>
                      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
                        <Bouton
                          className="fr-btn--secondary fr-mr-2w"
                          label="Annuler"
                          onClick={fermerLaModaleDeReactivationUtilisateur}
                        />
                        <Bouton
                          label="Confirmer la réactivation"
                          onClick={reactiverUtilisateur}
                        />
                      </div>
                    </Modale>
                  </div>
                )}
            </div>
          </Bloc>
        </div>
      </main>
    </PageUtilisateurStyled>
  );
};

export default PageUtilisateur;
