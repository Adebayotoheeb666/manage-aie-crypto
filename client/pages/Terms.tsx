export default function Terms() {
  const sections = [
    {
      id: "accept",
      title: "Acceptance of Terms",
      content: "By using our app, you agree to these terms.",
    },
    {
      id: "eligibility",
      title: "Eligibility",
      content: "Must be 18+ and not restricted by law in your region.",
    },
    {
      id: "use",
      title: "Use of Service",
      content: "Wallet use, API limits, account responsibilities.",
    },
    {
      id: "prohibited",
      title: "Prohibited Activities",
      content: "Fraud, hacking, reverse engineering.",
    },
    {
      id: "fees",
      title: "Fees & Payments",
      content: "Transaction fees are subject to network conditions.",
    },
    {
      id: "risk",
      title: "Risk Disclosure",
      content: "Cryptocurrency values are volatile. Use at your own risk.",
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      content:
        "We are not responsible for losses due to blockchain errors or user mistakes.",
    },
    {
      id: "ip",
      title: "Intellectual Property",
      content: "Branding, logo, and UI protected.",
    },
    {
      id: "termination",
      title: "Termination",
      content: "Rights to suspend access for violations.",
    },
    {
      id: "law",
      title: "Governing Law",
      content: "These terms are governed by the laws of your jurisdiction.",
    },
    { id: "contact", title: "Contact", content: "legal@yourapp.com" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="font-bold text-gray-900">
            CryptoVault
          </a>
          <nav className="hidden md:flex gap-6 text-gray-600">
            <a href="/privacy" className="hover:text-gray-900">
              Privacy
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <span className="text-sm text-gray-500">
              Last updated: January 2025
            </span>
          </div>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {s.title}
              </h2>
              <p className="text-gray-700">{s.content}</p>
            </section>
          ))}
          <div className="mt-10">
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Agree & Continue
            </a>
          </div>
        </article>
      </main>

      <footer className="bg-gray-50 border-t border-blue-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 CryptoVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
