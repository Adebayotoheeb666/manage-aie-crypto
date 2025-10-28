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
    q: "How do I withdraw funds?",
    a: "Go to Dashboard → Withdraw, enter the recipient address, select network, and confirm.",
    cat: "deposits",
  },
  {
    q: "How do you protect my data?",
    a: "We use HTTPS, never store seed phrases, and apply strict access controls.",
    cat: "security",
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
