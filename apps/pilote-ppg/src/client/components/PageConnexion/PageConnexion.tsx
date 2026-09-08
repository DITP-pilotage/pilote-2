import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import { useEnv } from "@/client/hooks/useEnv";
import Titre from "@/components/_commons/Titre/Titre";
import { messageDeConnexion } from "./messagesConnexion";

const premierParametre = (
  valeur: string | string[] | undefined,
): string | null =>
  Array.isArray(valeur) ? (valeur[0] ?? null) : (valeur ?? null);

export const PageConnexion: FunctionComponent = () => {
  const { query } = useRouter();
  const ffProConnect = useEnv("NEXT_PUBLIC_FF_PROCONNECT");

  const callbackUrl = premierParametre(query.callbackUrl) ?? undefined;
  const message = messageDeConnexion({
    motif: premierParametre(query.motif),
    error: premierParametre(query.error),
  });

  return (
    <main>
      <div className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6">
            <Titre baliseHtml="h1">Connexion à PILOTE</Titre>

            {message ? (
              <div className="fr-alert fr-alert--error fr-mb-4w" role="alert">
                <p>{message}</p>
                <p>
                  Besoin d'aide ?{" "}
                  <a
                    className="fr-link"
                    href="mailto:pilote@modernisation.gouv.fr"
                  >
                    pilote@modernisation.gouv.fr
                  </a>
                </p>
              </div>
            ) : null}

            {ffProConnect ? (
              <div className="fr-mb-4w">
                <button
                  className="proconnect-button"
                  onClick={() => signIn("proconnect", { callbackUrl })}
                  type="button"
                >
                  S'identifier avec ProConnect
                </button>
                <p className="fr-mt-1w fr-text--sm">
                  <a
                    className="fr-link"
                    href="https://proconnect.gouv.fr/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Qu'est-ce que ProConnect ?
                  </a>
                </p>
              </div>
            ) : null}

            <button
              className="fr-btn fr-btn--secondary"
              onClick={() => signIn("keycloak", { callbackUrl })}
              type="button"
            >
              Se connecter avec une adresse électronique et un mot de passe
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
