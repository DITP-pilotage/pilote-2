import { configuration } from "@/config";

let emailsAutorisesCache: ReadonlySet<string> | null = null;

const getEmailsAutorisesAskAITerritoire = (): ReadonlySet<string> => {
  if (emailsAutorisesCache === null) {
    emailsAutorisesCache = new Set(
      configuration()
        .askAITerritoireEmails.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    );
  }
  return emailsAutorisesCache;
};

export const estEmailAutoriseAskAITerritoire = (
  email: string | null | undefined,
): boolean => {
  if (!email) {
    return false;
  }
  return getEmailsAutorisesAskAITerritoire().has(email.toLowerCase());
};
