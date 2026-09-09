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
  const groupes: GroupeConversations<T>[] = [
    { libelle: "Aujourd'hui", conversations: [] },
    { libelle: "Cette semaine", conversations: [] },
    { libelle: "Plus ancien", conversations: [] },
  ];

  for (const conversation of conversations) {
    const date = new Date(conversation.updatedAt);
    if (estAujourdhui({ date, maintenant })) {
      groupes[0].conversations.push(conversation);
    } else if (estCetteSemaine({ date, maintenant })) {
      groupes[1].conversations.push(conversation);
    } else {
      groupes[2].conversations.push(conversation);
    }
  }

  return groupes.filter((groupe) => groupe.conversations.length > 0);
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
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};
