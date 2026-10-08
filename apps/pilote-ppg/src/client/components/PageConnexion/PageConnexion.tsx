import { signIn } from "next-auth/react";
import { Button } from "@/components/shared/Button";
import { useRouter } from "next/router";
import { z } from "zod";
import { useEnv } from "@/client/hooks/useEnv";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { BoutonProConnect } from "./BoutonProConnect";
import { messageDeConnexion } from "./messagesConnexion";
import { TextLink } from "@/components/shared/TextLink";

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
            <h1 className="text-h4 md:text-h4-md mb-2 text-center">
              Connexion à PILOTE
            </h1>
            <p className="text-dsfr-mention-grey fr-mb-4w fr-text--sm">
              {ffProConnect
                ? "Choisissez votre mode de connexion."
                : "ProConnect arrive bientôt sur PILOTE. Vous pourrez alors accéder à votre compte avec ProConnect ou continuer d'utiliser vos identifiants habituels."}
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

            <BoutonProConnect
              onClick={() => signIn("proconnect", { callbackUrl })}
            />

            <div className="fr-my-4w flex items-center gap-4">
              <span className="bg-dsfr-contrast-grey h-px flex-1" />
              <span className="text-dsfr-mention-grey text-sm">ou</span>
              <span className="bg-dsfr-contrast-grey h-px flex-1" />
            </div>

            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => signIn("keycloak", { callbackUrl })}
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
