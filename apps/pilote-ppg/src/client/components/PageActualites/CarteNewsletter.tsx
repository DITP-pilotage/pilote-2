import Link from "next/link";
import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

type CarteNewsletterProps = {
  newsletter: Newsletter;
};

export const CarteNewsletter = ({ newsletter }: CarteNewsletterProps) => {
  return (
    <Link
      className="group flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-600 hover:shadow-md"
      href={`/actualites/${newsletter.id}`}
    >
      <p className="text-sm text-gray-500">
        {PiloteDateFormatter.isoDateFranceMetropolitaine(newsletter.dateEnvoi)}
      </p>
      <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
        {newsletter.sujet}
      </h2>
      <span className="mt-auto text-sm font-medium text-blue-600">
        Lire la newsletter →
      </span>
    </Link>
  );
};
