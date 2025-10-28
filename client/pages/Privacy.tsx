export default function Privacy() {
  const sections = [
    {
      id: "intro",
      title: "Introduction",
      content:
        "This Privacy Policy explains how CryptoVault collects, uses, and safeguards your information.",
    },
    {
      id: "collect",
      title: "Information We Collect",
      content:
        "Personal info (email, wallet address). Usage data (analytics, cookies).",
    },
    {
      id: "use",
      title: "How We Use Information",
      content:
        "Service improvement, transaction verification, marketing (opt-in only).",
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      content:
        "We use analytics cookies and may process public blockchain data.",
    },
    {
      id: "security",
      title: "Data Security",
      content:
        "Encryption, limited employee access, and secure storage practices.",
    },
    {
      id: "rights",
      title: "User Rights",
      content: "Access, correction, and deletion of data where applicable.",
    },
    {
      id: "third",
      title: "Third-Party Services",
      content:
        "Stripe, SendGrid, WalletConnect, and others may process data per their policies.",
    },
    {
      id: "updates",
      title: "Policy Updates",
      content: "Updated January 2025. Changes will be posted here.",
    },
    { id: "contact", title: "Contact", content: "privacy@yourapp.com" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="font-bold text-gray-900">
            CryptoVault
          </a>
          <nav className="hidden md:flex gap-6 text-gray-600">
            <a href="/terms" className="hover:text-gray-900">
              Terms
            </a>
            <a href="/help" className="hover:text-gray-900">
              Help
            </a>
            <a href="/contact" className="hover:text-gray-900">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
        <aside className="md:sticky md:top-4 h-fit border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Table of Contents
          </h3>
          <ul className="space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <article className="prose max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {s.title}
              </h2>
              <p className="text-gray-700">{s.content}</p>
            </section>
          ))}
        </article>
      </main>

      <footer className="bg-gray-50 border-t border-blue-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600">
          <p>Last updated: January 2025</p>
        </div>
      </footer>
    </div>
  );
}
