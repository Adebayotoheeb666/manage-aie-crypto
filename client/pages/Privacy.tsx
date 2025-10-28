export default function Privacy() {
  const sections = [
    {
      id: "intro",
      title: "Introduction",
      content:
        "This Privacy Policy explains how CryptoVault collects, uses, and safeguards your information. We are committed to protecting your privacy and ensuring transparency in how we handle your data. This policy applies to all users of the CryptoVault platform, website, and services.",
    },
    {
      id: "collect",
      title: "Information We Collect",
      content:
        "We collect several types of information to provide and improve our services: (1) Account Information: Email address, username, profile information you provide during registration. (2) Wallet Data: Public blockchain addresses you connect to our platform (we never collect private keys or seed phrases). (3) Transaction Data: Information about transactions you perform, including amounts, dates, and tokens involved. (4) Usage Data: How you interact with our platform, including pages visited, features used, and time spent. (5) Device Information: Device type, operating system, browser type, and IP address. (6) Cookies and Tracking: We use cookies and similar technologies to enhance your experience.",
    },
    {
      id: "use",
      title: "How We Use Information",
      content:
        "We use the information we collect for the following purposes: (1) Service Delivery: To provide, maintain, and improve our platform features and functionality. (2) Security: To detect fraud, prevent unauthorized access, and protect user accounts. (3) Verification: To verify user identity and comply with regulatory requirements. (4) Analytics: To understand how users interact with our platform and improve user experience. (5) Communication: To send you service updates, security alerts, and support messages. (6) Marketing: To send promotional content only if you've opted in. We never share marketing data without explicit consent. (7) Legal Compliance: To comply with applicable laws and regulations.",
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      content:
        "We use analytics cookies (Google Analytics, Mixpanel) to understand platform usage and improve our services. These cookies collect anonymized data and do not identify individual users. We also use session cookies to maintain your login state and security cookies to prevent unauthorized access. You can control cookie preferences through your browser settings. Please note that disabling cookies may affect platform functionality. We do not conduct blockchain data tracking—we only monitor publicly available information when you choose to connect your wallet.",
    },
    {
      id: "security",
      title: "Data Security",
      content:
        "CryptoVault implements industry-standard security measures to protect your data: (1) Encryption: All data in transit uses TLS/SSL encryption. Sensitive data at rest is encrypted with AES-256. (2) Access Controls: Only authorized employees with a legitimate business need can access user data. (3) Regular Audits: We conduct regular security audits and penetration testing. (4) Password Protection: Your account password is hashed and salted. (5) No Seed Phrase Storage: We never store your private keys, seed phrases, or sensitive wallet data. (6) Data Retention: We retain data only as long as necessary to provide services or comply with legal obligations.",
    },
    {
      id: "rights",
      title: "User Rights",
      content:
        "Depending on your location, you may have the following rights regarding your data: (1) Right of Access: You can request a copy of the personal data we hold about you. (2) Right to Correction: You can request correction of inaccurate data. (3) Right to Deletion: You can request deletion of your data, subject to legal retention requirements. (4) Right to Portability: You can request your data in a portable format. (5) Right to Opt-Out: You can opt out of marketing communications at any time. To exercise these rights, contact us at privacy@cryptovault.com with proof of identity.",
    },
    {
      id: "third",
      title: "Third-Party Services",
      content:
        "We use third-party services to enhance our platform. These services may process your data according to their privacy policies: (1) Payment Processors: Stripe processes payment information for premium features. (2) Email Services: SendGrid handles transactional emails. (3) Wallet Integration: WalletConnect enables secure wallet connections. (4) Analytics: Google Analytics and Mixpanel track usage patterns. (5) Cloud Infrastructure: AWS hosts our servers. We ensure all third parties comply with data protection standards and have data processing agreements in place.",
    },
    {
      id: "updates",
      title: "Policy Updates",
      content:
        "We may update this Privacy Policy to reflect changes in our practices, technology, or legal requirements. We will notify you of significant changes via email or a prominent notice on our platform. Your continued use of CryptoVault after changes indicates your acceptance of the updated policy. Last updated: January 2025.",
    },
    {
      id: "contact",
      title: "Contact",
      content:
        "If you have questions about this Privacy Policy or our privacy practices, please contact us at privacy@cryptovault.com. You can also submit a request through our contact form at https://cryptovault.com/contact. For EU residents with GDPR concerns, you may file a complaint with your local data protection authority.",
    },
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
