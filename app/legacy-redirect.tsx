export const legacyRedirectMetadata = {
  title: "Hixhame Tina",
  alternates: { canonical: "/sq/" },
  robots: {
    index: false,
    follow: true,
  },
};

export function LegacyRedirect() {
  return (
    <main className="legacy-redirect">
      <meta httpEquiv="refresh" content="0; url=/sq/#ballina" />
      <h1>Hixhame Tina</h1>
      <p>Po të kthejmë te faqja kryesore.</p>
      <Link href="/sq/#ballina">Hape faqen kryesore</Link>
    </main>
  );
}
import Link from "next/link";
