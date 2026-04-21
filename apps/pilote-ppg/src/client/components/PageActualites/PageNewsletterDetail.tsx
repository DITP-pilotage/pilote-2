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
            {PiloteDateFormatter.isoDateFranceMetropolitaine(
              newsletter.dateEnvoi,
            )}
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
