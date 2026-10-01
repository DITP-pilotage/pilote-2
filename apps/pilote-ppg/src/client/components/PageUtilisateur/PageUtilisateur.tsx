import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { useSession } from "next-auth/react";
import { FunctionComponent } from "react";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import FicheUtilisateur from "@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Modale } from "@/components/shared/Modale";
import { Notice } from "@/components/shared/Notice";
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
    modificationEstImpossible,
    donnneContenuBandeau,
    habilitationsAGenererUnTokenDAuthentification,
    reactiverUtilisateur,
  } = usePageUtilisateur(utilisateur);
  const chemin = [{ nom: "Gestion des comptes", lien: "/admin/utilisateurs" }];
  const { data: session } = useSession();
  const { creerTokenAPI, alerte } = useGestionTokenAPI();

  return (
    <div className="bg-dsfr-alt-blue-france fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Utilisateur" />
        <div className="fiche-utilisateur fr-pb-4w">
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
          <Titre baliseHtml="h1" className="fr-h1 fr-mt-2w">
            Fiche du compte
          </Titre>
          <Bloc>
            <div className="fr-py-2w fr-px-4w">
              {modificationEstImpossible(
                session,
                utilisateur.habilitations,
                utilisateur.profil,
              ) && (
                <div className="fr-pb-4w">
                  <Notice
                    title={donnneContenuBandeau(
                      session,
                      utilisateur.habilitations,
                      utilisateur.profil,
                    )}
                  />
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
                    <Button asChild variant="primary" className="mr-4">
                      <Link
                        href={`/admin/utilisateur/${utilisateur.id}/modifier`}
                      >
                        Modifier
                      </Link>
                    </Button>
                    {habilitationsAGenererUnTokenDAuthentification(
                      // @ts-expect-error session est forcément not null içi
                      session,
                      utilisateur.profil,
                    ) ? (
                      <Button
                        variant="secondary"
                        className="mr-4"
                        onClick={() =>
                          creerTokenAPI({ email: utilisateur.email })
                        }
                        title="Générer un token d'authentification"
                        type="submit"
                      >
                        Générer un token d'authentification
                      </Button>
                    ) : null}
                    <Modale
                      title="Désactivation de compte"
                      trigger={
                        <button className="fr-text text-primary" type="button">
                          Désactiver le compte
                        </button>
                      }
                    >
                      <div>
                        Vous êtes sur le point de désactiver le compte de{" "}
                        <span className="uppercase">{utilisateur.prénom}</span>{" "}
                        <span className="uppercase">{utilisateur.nom}.</span>
                      </div>
                      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
                        <Modale.Close asChild>
                          <Button className="!mr-2" variant="secondary">
                            Annuler
                          </Button>
                        </Modale.Close>
                        <Button
                          onClick={desactiverUtilisateur}
                          variant="primary"
                        >
                          Confirmer la désactivation
                        </Button>
                      </div>
                    </Modale>
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
                      <Alerte type="info" classesSupplementaires="fr-mt-2w">
                        <p className="fr-text--sm">
                          Information : Un token est déjà actif pour cet
                          utilisateur. La génération d'un nouveau token
                          supprimera ce token actif.
                        </p>
                      </Alerte>
                    ) : null}
                  </div>
                )}
              {!!utilisateur.dateDesactivation &&
                !modificationEstImpossible(
                  session,
                  utilisateur.habilitations,
                  utilisateur.profil,
                ) && (
                  <div className="fr-grid-row fr-mt-4w">
                    <Modale
                      title="Réactivation de compte"
                      trigger={
                        <Button variant="primary" type="button">
                          Réactiver le compte
                        </Button>
                      }
                    >
                      <div>
                        Vous êtes sur le point de réactiver le compte de{" "}
                        <span className="uppercase">{utilisateur.prénom}</span>{" "}
                        <span className="uppercase">{utilisateur.nom}.</span> Un
                        message de réinitialisation de mot de passe lui sera
                        transmis automatiquement.
                      </div>
                      <div className="fr-grid-row fr-grid-row--right fr-mt-4w">
                        <Modale.Close asChild>
                          <Button className="!mr-2" variant="secondary">
                            Annuler
                          </Button>
                        </Modale.Close>
                        <Button
                          onClick={reactiverUtilisateur}
                          variant="primary"
                        >
                          Confirmer la réactivation
                        </Button>
                      </div>
                    </Modale>
                  </div>
                )}
            </div>
          </Bloc>
        </div>
      </main>
    </div>
  );
};

export default PageUtilisateur;
