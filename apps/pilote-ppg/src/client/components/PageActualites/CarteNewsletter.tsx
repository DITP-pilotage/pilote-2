import Link from "next/link";
import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

type CarteNewsletterProps = {
  newsletter: Newsletter;
};

export const CarteNewsletter = ({ newsletter }: CarteNewsletterProps) => {
  return (
    <Link
      className="group flex min-h-48 flex-col rounded border border-gray-200 bg-white p-6 transition hover:border-blue-700"
      href={`/actualites/${newsletter.id}`}
    >
      <h2 className="text-lg font-bold leading-snug text-blue-900 group-hover:text-blue-700">
        {newsletter.sujet}
      </h2>
      <p className="mt-3 text-sm text-gray-500">
        Publié le{" "}
        {PiloteDateFormatter.dateFrancaiseLongue(
          new Date(newsletter.dateEnvoi),
        )}
      </p>
      <span className="mt-auto self-end text-xl font-light text-blue-700">
        →
      </span>
    </Link>
  );
};
