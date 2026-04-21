import Link from "next/link";
import { NewsletterContrat } from "@/server/actualites/app/contrats/NewsletterContrat";

const formaterDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

type PageNewsletterDetailProps = {
  newsletter: NewsletterContrat;
};

export const PageNewsletterDetail = ({
  newsletter,
}: PageNewsletterDetailProps) => {
  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <Link
          className="text-sm text-blue-600 hover:underline"
          href="/actualites"
        >
          ← Retour aux actualités
        </Link>
        <span className="text-gray-300">|</span>
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            {newsletter.sujet}
          </h1>
          <p className="text-xs text-gray-500">
            {formaterDate(newsletter.dateEnvoi)}
          </p>
        </div>
      </div>
      <iframe
        className="w-full flex-1 border-0"
        src={newsletter.lienArchive}
        title={newsletter.sujet}
      />
    </main>
  );
};
