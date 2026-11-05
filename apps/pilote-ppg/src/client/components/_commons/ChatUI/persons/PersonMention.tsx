import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import { formatPerson } from "@/shared/personne/personReference";
import { usePerson } from "@/components/_commons/ChatUI/persons/usePerson";

export const PersonMention = ({ id }: { id: string }) => {
  const { data: person, isPending } = usePerson(id);

  if (isPending) return <span aria-busy="true">…</span>;
  if (!person) return <>{formatPerson(null)}</>;

  return (
    <NomUtilisateurAvecTooltip
      email={person.email}
      fonction={person.fonction}
      nom={formatPerson(person)}
      service={person.service}
    />
  );
};
