import { Fragment, type ReactNode } from "react";
import { usePerson } from "@/components/_commons/ChatUI/persons/usePerson";
import {
  PERSON_REFERENCE_PATTERN,
  formatPerson,
  normalizePersonId,
} from "@/shared/personne/personReference";

const PersonName = ({ id }: { id: string }) => {
  const { data: person, isPending } = usePerson(id);
  return <>{isPending ? "…" : formatPerson(person)}</>;
};

/** Un texte brut dont les références de personnes sont remplacées par leur nom, sans infobulle (utilisable dans un bouton). */
export const TextWithPersons = ({ text }: { text: string }) => {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(PERSON_REFERENCE_PATTERN)) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(<PersonName id={normalizePersonId(match[1])} />);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </>
  );
};
