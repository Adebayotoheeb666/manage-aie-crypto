import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { key: "wallet", label: "Wallet & Account Setup", icon: "💳" },
  { key: "deposits", label: "Deposits & Withdrawals", icon: "↕️" },
  { key: "security", label: "Security & Privacy", icon: "🔐" },
  { key: "tx", label: "Transaction Issues", icon: "⚙️" },
  { key: "api", label: "Developer APIs", icon: "{ }" },
  { key: "other", label: "Others", icon: "❓" },
];

const FAQ = [
  {
    q: "How do I reset my wallet password?",
    a: "Use your wallet provider's recovery options. For self-custody, recovery requires your seed phrase.",
    cat: "wallet",
  },
  {
    q: "What wallet types does CryptoVault support?",
    a: "We support seed phrase import only.",
    cat: "wallet",
  },
  {
    q: "Can I connect multiple wallets to my account?",
    a: "Yes, you can connect multiple wallet addresses to a single CryptoVault account for easy portfolio management.",
    cat: "wallet",
  },
  {
    q: "How do I manage wallet permissions?",
    a: "Go to Settings → Connected Wallets to revoke permissions, disconnect wallets, or modify what each wallet can access.",
    cat: "wallet",
  },
  {
    q: "What tokens do you support?",
    a: "We support major L1/L2 chains and stablecoins. See the Dashboard for your specific assets.",
    cat: "other",
  },
  {
    q: "Why is my transaction pending?",
    a: "Network congestion or low gas fees can cause delays. Check your tx on a block explorer.",
    cat: "tx",
  },
  {
    q: "How do I speed up a pending transaction?",
    a: "You can increase the gas price (gas bump) through your wallet. Higher gas typically means faster confirmation.",
    cat: "tx",
  },
  {
    q: "What if my transaction fails?",
    a: "Failed transactions still consume gas. Check the error message in your wallet for details. You may need to retry with different parameters.",
    cat: "tx",
  },
  {
    q: "Can I cancel a transaction?",
    a: "Once a transaction is confirmed on-chain, it cannot be cancelled. However, you can replace a pending transaction with a higher gas fee.",
    cat: "tx",
  },
  {
    q: "How do I withdraw funds?",
    a: "Go to Dashboard → Withdraw, enter the recipient address, select network, and confirm.",
    cat: "deposits",
  },
  {
    q: "What are the withdrawal fees?",
    a: "Withdrawal fees vary by network and are displayed before confirmation. We don't charge additional fees—you only pay network gas costs.",
    cat: "deposits",
  },
  {
    q: "How long do deposits take to appear?",
    a: "Deposits appear after blockchain confirmation. Ethereum typically takes 1-5 minutes, while other networks may vary. Check the block explorer for status.",
    cat: "deposits",
  },
  {
    q: "Is there a minimum deposit amount?",
    a: "No minimum deposit amount, but note that transaction fees (gas) apply regardless of deposit size.",
    cat: "deposits",
  },
  {
    q: "How do you protect my data?",
    a: "We use HTTPS, never store seed phrases, and apply strict access controls.",
    cat: "security",
  },
  {
    q: "Is my seed phrase ever stored on your servers?",
    a: "Absolutely not. Your seed phrase remains with you and is never transmitted to or stored on our servers. We only interact with public addresses.",
    cat: "security",
  },
  {
    q: "What should I do if I suspect my account is compromised?",
    a: "Disconnect your wallets immediately from the CryptoVault platform and move your assets to a new secure wallet if necessary.",
    cat: "security",
  },
  {
    q: "Does CryptoVault have insurance?",
    a: "CryptoVault is a portfolio tracking platform, not a custodian. Your assets remain in your personal wallet, so standard insurance doesn't apply.",
    cat: "security",
  },
  {
    q: "Do you offer an API?",
    a: "Yes! We provide REST and WebSocket APIs for developers. Sign up for API access in your account Settings.",
    cat: "api",
  },
  {
    q: "What are the API rate limits?",
    a: "Free tier: 100 requests/hour. Pro tier: 10,000 requests/hour. Enterprise: custom limits available.",
    cat: "api",
  },
  {
    q: "How do I authenticate API requests?",
    a: "Use your API key in the Authorization header: Authorization: Bearer YOUR_API_KEY",
    cat: "api",
  },
  {
    q: "Can I get real-time data through the API?",
    a: "Yes, our WebSocket API provides real-time portfolio updates, price feeds, and transaction notifications.",
    cat: "api",
  },
  {
    q: "What is gas and why do I need to pay it?",
    a: "Gas is the fee you pay to execute transactions on the blockchain. It compensates network validators and varies based on network congestion.",
    cat: "other",
  },
  {
    q: "What are layer 2 networks and why should I use them?",
    a: "Layer 2s like Polygon and Arbitrum offer faster, cheaper transactions by bundling multiple trades before settling on Ethereum.",
    cat: "other",
  },
  {
    q: "How do I report a bug or security issue?",
    a: "Please email security@cryptovault.com with details. We offer bounties for responsibly disclosed vulnerabilities.",
    cat: "other",
  },
];

export default function Help() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.filter(
      (f) =>
        (category ? f.cat === category : true) &&
        (q === "" ||
          f.q.toLowerCase().includes(q) ||
          f.a.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="font-bold text-gray-900">
            CryptoVault
          </a>
          <nav className="hidden md:flex gap-6 text-gray-600">
            <a href="/about" className="hover:text-gray-900">
              About
            </a>
            <a href="/blog" className="hover:text-gray-900">
              Blog
            </a>
            <a href="/contact" className="hover:text-gray-900">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Search */}
      <section className="py-14 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">
            How can we help you today?
          </h1>
          <div className="mt-6">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="bg-white h-12 rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(category === c.key ? null : c.key)}
              className={`border rounded-xl p-4 text-center hover:shadow transition ${category === c.key ? "border-blue-400 bg-blue-50" : "border-blue-100 bg-white"}`}
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="text-sm mt-2 text-gray-700">{c.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Accordion type="single" collapsible className="w-full">
            {items.map((f, idx) => (
              <AccordionItem value={`item-${idx}`} key={idx}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <div className="bg-white border border-blue-100 rounded-xl p-6 inline-block">
              <p className="text-gray-700 mb-3">Still need help?</p>
              <Button
                onClick={() => (window.location.href = "/contact")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 border-t border-blue-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 CryptoVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
