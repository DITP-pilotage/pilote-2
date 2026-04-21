import Link from "next/link";
import { Newsletter } from "@/server/actualites/domain/Newsletter";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

type PageNewsletterDetailProps = {
  newsletter: Newsletter;
};

export const PageNewsletterDetail = ({
  newsletter,
}: PageNewsletterDetailProps) => {
  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="mx-auto max-w-6xl">
          <Link
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            href="/actualites"
          >
            ← Actualités
          </Link>
          <div className="mt-4 border-l-4 border-l-blue-700 pl-4">
            <p className="mb-1 text-sm text-gray-400">
              Publié le{" "}
              {PiloteDateFormatter.dateFrancaiseLongue(
                new Date(newsletter.dateEnvoi),
              )}
            </p>
            <h1 className="text-xl font-bold leading-snug text-blue-900">
              {newsletter.sujet}
            </h1>
          </div>
        </div>
      </div>
      <iframe
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full flex-1 border-0"
        src={newsletter.lienArchive}
        title={newsletter.sujet}
      />
    </main>
  );
};
