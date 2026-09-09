import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { z } from "zod";
import { useEnv } from "@/client/hooks/useEnv";
import Alerte from "@/components/_commons/Alerte/Alerte";
import Titre from "@/components/_commons/Titre/Titre";
import { BoutonProConnect } from "./BoutonProConnect";
import { messageDeConnexion } from "./messagesConnexion";

const ADRESSE_ASSISTANCE = "pilote.ditp@modernisation.gouv.fr";

/**
 * Next répète un paramètre d'URL sous forme de tableau. On ne garde que la
 * première valeur, et rien du tout si le paramètre est absent.
 */
const parametreSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((valeur) =>
    Array.isArray(valeur) ? (valeur[0] ?? null) : (valeur ?? null),
  );

const parametresConnexionSchema = z.object({
  callbackUrl: parametreSchema,
  motif: parametreSchema,
  error: parametreSchema,
});

export const PageConnexion = () => {
  const { query } = useRouter();
  const ffProConnect = useEnv("NEXT_PUBLIC_FF_PROCONNECT");

  const parametres = parametresConnexionSchema.parse(query);
  const callbackUrl = parametres.callbackUrl ?? undefined;
  const message = messageDeConnexion({
    motif: parametres.motif,
    error: parametres.error,
  });

  return (
    <main>
      <div className="fr-container fr-py-10w">
        <div className="mx-auto w-full max-w-[38rem]">
          <div className="border-dsfr-grey-925 border bg-white p-6 md:p-8">
            <Titre baliseHtml="h1" className="fr-h4 fr-mb-1w">
              Connexion à PILOTE
            </Titre>
            <p className="text-dsfr-mention-grey fr-mb-4w fr-text--sm">
              {ffProConnect
                ? "Choisissez votre mode de connexion."
                : "Connectez-vous avec vos identifiants PILOTE."}
            </p>

            {message ? (
              <div role="alert">
                <Alerte
                  classesSupplementaires="fr-mb-4w"
                  message={message}
                  type="erreur"
                />
              </div>
            ) : null}

            {ffProConnect ? (
              <>
                <BoutonProConnect
                  onClick={() => signIn("proconnect", { callbackUrl })}
                />
                <div className="fr-my-4w flex items-center gap-4">
                  <span className="bg-dsfr-contrast-grey h-px flex-1" />
                  <span className="text-dsfr-mention-grey text-sm">ou</span>
                  <span className="bg-dsfr-contrast-grey h-px flex-1" />
                </div>
              </>
            ) : null}

            <button
              className="fr-btn fr-btn--secondary w-full justify-center"
              onClick={() => signIn("keycloak", { callbackUrl })}
              type="button"
            >
              Se connecter avec une adresse électronique et un mot de passe
            </button>

            <p className="text-dsfr-mention-grey fr-mt-4w fr-mb-0 fr-text--xs">
              Un problème pour vous connecter ?{" "}
              <a
                className="fr-link fr-link--xs"
                href={`mailto:${ADRESSE_ASSISTANCE}`}
              >
                {ADRESSE_ASSISTANCE}
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
