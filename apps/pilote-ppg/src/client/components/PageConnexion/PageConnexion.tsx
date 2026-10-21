import { signIn } from "next-auth/react";
import { Button } from "@/components/shared/Button";
import { useRouter } from "next/router";
import { z } from "zod";
import { useEnv } from "@/client/hooks/useEnv";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { BoutonProConnect } from "./BoutonProConnect";
import { messageDeConnexion } from "./messagesConnexion";
import { TextLink } from "@/components/shared/TextLink";
import { useAnalytics } from "@/client/analytics/useAnalytics";

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
  const { trackEvent } = useAnalytics();

  const signInWith = (provider: "proconnect" | "keycloak") => {
    trackEvent({
      category: "authentification",
      action: "select",
      name: `login.${provider}`,
    });
    void signIn(provider, { callbackUrl });
  };

  return (
    <main>
      <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] py-20">
        <div className="mx-auto w-full max-w-[38rem]">
          <div className="border-dsfr-grey-925 border bg-white p-6 md:p-8">
            <h1 className="text-h4 md:text-h4-md mb-2 text-center">
              Connexion à PILOTE
            </h1>
            <p className="text-sm print:text-base text-dsfr-mention-grey mb-8">
              {ffProConnect
                ? "Choisissez votre mode de connexion."
                : "ProConnect arrive bientôt sur PILOTE. Vous pourrez alors accéder à votre compte avec ProConnect ou continuer d'utiliser vos identifiants habituels."}
            </p>

            {message ? (
              <div role="alert">
                <Alerte
                  classesSupplementaires="mb-8"
                  message={message}
                  type="erreur"
                />
              </div>
            ) : null}

            <BoutonProConnect onClick={() => signInWith("proconnect")} />

            <div className="my-8 flex items-center gap-4">
              <span className="bg-dsfr-contrast-grey h-px flex-1" />
              <span className="text-dsfr-mention-grey text-sm">ou</span>
              <span className="bg-dsfr-contrast-grey h-px flex-1" />
            </div>

            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => signInWith("keycloak")}
              type="button"
            >
              <span className="flex flex-col text-center">
                <span>Se connecter avec mes identifiants PILOTE</span>
                <span>(adresse électronique et mot de passe)</span>
              </span>
            </Button>

            <p className="mt-8 mb-0 text-xs text-dsfr-mention-grey">
              Un problème pour vous connecter ?{" "}
              <TextLink href={`mailto:${ADRESSE_ASSISTANCE}`} size="xs">
                {ADRESSE_ASSISTANCE}
              </TextLink>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
