import { NewsletterContrat } from "@/server/actualites/app/contrats/NewsletterContrat";

const formaterDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

type CarteNewsletterProps = {
  newsletter: NewsletterContrat;
};

export const CarteNewsletter = ({ newsletter }: CarteNewsletterProps) => {
  return (
    <a
      className="group flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-600 hover:shadow-md"
      href={newsletter.lienArchive}
      rel="noopener noreferrer"
      target="_blank"
    >
      <p className="text-sm text-gray-500">{formaterDate(newsletter.dateEnvoi)}</p>
      <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
        {newsletter.sujet}
      </h2>
      <span className="mt-auto text-sm font-medium text-blue-600">
        Lire la newsletter →
      </span>
    </a>
  );
};
