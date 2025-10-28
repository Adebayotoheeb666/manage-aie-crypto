import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export type BlogArticle = {
  slug: string;
  title: string;
  category: "Tutorials" | "Market" | "Updates" | "Security";
  author: string;
  date: string; // ISO
  excerpt: string;
  cover: string;
  readingTime: string;
  content: string;
};

export const BLOG_POSTS: BlogArticle[] = [
  {
    slug: "connect-wallet-safely",
    title: "How to Connect Your Wallet Safely",
    category: "Security",
    author: "Team CryptoVault",
    date: "2025-01-15",
    excerpt:
      "Protect your funds with these best practices when linking wallets.",
    cover: "/placeholder.svg",
    readingTime: "6 min read",
    content:
      "Learn essential steps to safely connect your wallet, verify URLs, approve permissions carefully, and avoid common pitfalls.",
  },
  {
    slug: "stablecoins-2025-guide",
    title: "Understanding Stablecoins: A 2025 Guide",
    category: "Market",
    author: "Jane Doe",
    date: "2025-01-10",
    excerpt:
      "Explore how stablecoins work, their risks, and where they fit in DeFi.",
    cover: "/placeholder.svg",
    readingTime: "8 min read",
    content:
      "A clear overview of stablecoins, collateral models, and what to consider before using them.",
  },
  {
    slug: "product-updates-q1",
    title: "Product Updates: Q1 Highlights",
    category: "Updates",
    author: "Team CryptoVault",
    date: "2025-01-05",
    excerpt: "New features, performance improvements, and integrations.",
    cover: "/placeholder.svg",
    readingTime: "4 min read",
    content:
      "We shipped performance wins, smoother onboarding, and broader chain support.",
  },
  {
    slug: "defi-tutorial-getting-started",
    title: "Getting Started with DeFi: Step-by-Step",
    category: "Tutorials",
    author: "Alex Kim",
    date: "2024-12-28",
    excerpt: "A practical walkthrough for using DeFi apps with confidence.",
    cover: "/placeholder.svg",
    readingTime: "10 min read",
    content:
      "From funding a wallet to staking and swapping, learn the basics with safety in mind.",
  },
];

const CATEGORIES = [
  "All",
  "Tutorials",
  "Market",
  "Updates",
  "Security",
] as const;

export default function Blog() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    return BLOG_POSTS.filter((p) => {
      const byCat = category === "All" || p.category === category;
      const q = query.trim().toLowerCase();
      const byQuery =
        q === "" ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q);
      return byCat && byQuery;
    });
  }, [query, category]);

  const featured = filtered.slice(0, 3);
  const recent = filtered.slice(0, 9);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">₿</span>
            </div>
            <a href="/" className="text-xl font-bold text-gray-900">
              CryptoVault
            </a>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </a>
            <a href="/help" className="text-gray-600 hover:text-gray-900">
              Help
            </a>
            <a href="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Blog Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-600 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Learn, Grow, and Stay Ahead in Crypto
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Insights, updates, and tutorials from the CryptoVault team.
          </p>
          <div className="max-w-2xl mx-auto">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="bg-white/95 backdrop-blur border-0 h-12 rounded-xl"
            />
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${category === c ? "bg-white text-blue-700" : "bg-white/20 text-white hover:bg-white/30"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl border border-blue-100 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/blog/${p.slug}`)}
            >
              <img
                src={p.cover}
                alt={p.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{p.category}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(p.date).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {p.title}
                </h3>
                <p className="text-gray-600 text-sm mt-2">{p.excerpt}</p>
                <div className="text-xs text-gray-500 mt-3">
                  {p.author} • {p.readingTime}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section className="py-4">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Posts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((p) => (
              <article
                key={p.slug}
                className="bg-white rounded-xl border border-blue-100 overflow-hidden hover:shadow-sm transition"
              >
                <img
                  src={p.cover}
                  alt={p.title}
                  className="w-full h-36 object-cover"
                />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{p.category}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(p.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {p.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {p.excerpt}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      {p.readingTime}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                      onClick={() => navigate(`/blog/${p.slug}`)}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-blue-50 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Join 20,000+ subscribers getting crypto insights weekly.
          </h3>
          <p className="text-gray-600 mb-6">No spam. Unsubscribe anytime.</p>
          <div className="flex gap-2 justify-center max-w-xl mx-auto">
            <Input
              placeholder="Enter your email"
              className="bg-white h-12 rounded-lg"
            />
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-blue-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2025 CryptoVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
