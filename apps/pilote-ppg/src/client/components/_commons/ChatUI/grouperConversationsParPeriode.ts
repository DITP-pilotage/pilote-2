const UN_JOUR_MS = 24 * 60 * 60 * 1000;

const debutDeJournee = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const estAujourdhui = ({
  date,
  maintenant,
}: {
  date: Date;
  maintenant: Date;
}) => debutDeJournee(date) === debutDeJournee(maintenant);

const estCetteSemaine = ({
  date,
  maintenant,
}: {
  date: Date;
  maintenant: Date;
}) => debutDeJournee(maintenant) - debutDeJournee(date) < 7 * UN_JOUR_MS;

const estMemeAnnee = ({ date, maintenant }: { date: Date; maintenant: Date }) =>
  date.getFullYear() === maintenant.getFullYear();

const estCeMois = ({ date, maintenant }: { date: Date; maintenant: Date }) =>
  estMemeAnnee({ date, maintenant }) &&
  date.getMonth() === maintenant.getMonth();

const libelleDuMois = ({
  date,
  maintenant,
}: {
  date: Date;
  maintenant: Date;
}): string => {
  const libelle = date.toLocaleDateString("fr-FR", {
    month: "long",
    ...(estMemeAnnee({ date, maintenant }) ? {} : { year: "numeric" }),
  });
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
};

const libelleDePeriode = ({
  date,
  maintenant,
}: {
  date: Date;
  maintenant: Date;
}): string => {
  if (estAujourdhui({ date, maintenant })) return "Aujourd'hui";
  if (estCetteSemaine({ date, maintenant })) return "Cette semaine";
  if (estCeMois({ date, maintenant })) return "Ce mois-ci";
  return libelleDuMois({ date, maintenant });
};

export type GroupeConversations<T> = {
  libelle: string;
  conversations: T[];
};

export const grouperConversationsParPeriode = <T extends { updatedAt: Date }>({
  conversations,
  maintenant,
}: {
  conversations: T[];
  maintenant: Date;
}): GroupeConversations<T>[] => {
  const groupes: GroupeConversations<T>[] = [];

  for (const conversation of conversations) {
    const libelle = libelleDePeriode({
      date: new Date(conversation.updatedAt),
      maintenant,
    });
    const dernierGroupe = groupes.at(-1);
    if (dernierGroupe?.libelle === libelle) {
      dernierGroupe.conversations.push(conversation);
    } else {
      groupes.push({ libelle, conversations: [conversation] });
    }
  }

  return groupes;
};

export const formaterDateConversation = ({
  date,
  maintenant,
}: {
  date: Date;
  maintenant: Date;
}): string => {
  const valeur = new Date(date);
  if (estAujourdhui({ date: valeur, maintenant })) {
    return valeur.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return valeur.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    ...(estMemeAnnee({ date: valeur, maintenant }) ? {} : { year: "numeric" }),
  });
};
