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
    cover:
      "https://images.pexels.com/photos/18500862/pexels-photo-18500862.jpeg",
    readingTime: "6 min read",
    content:
      "Securing your digital assets is paramount in the cryptocurrency world. This comprehensive guide walks you through the essential steps to safely connect your wallet to any platform.\n\nFirst, always verify the URL before entering your credentials. Phishing attacks are one of the most common threats, so double-check that you're on the legitimate website. Look for the padlock icon in your browser bar and ensure the domain name is correct.\n\nSecond, understand what permissions you're granting. Before approving any transaction or connection, carefully review what access the application is requesting. Never blindly approve permissions—read the details to ensure they match what you expect.\n\nThird, use hardware wallets when possible. Hardware wallets provide an extra layer of security by keeping your private keys offline, protected from online threats.\n\nFinally, never share your seed phrase or private keys with anyone, including support staff. Legitimate services will never ask for these sensitive details. Keep your recovery phrase written down and stored securely in a physical location.",
  },
  {
    slug: "stablecoins-2025-guide",
    title: "Understanding Stablecoins: A 2025 Guide",
    category: "Market",
    author: "Jane Doe",
    date: "2025-01-10",
    excerpt:
      "Explore how stablecoins work, their risks, and where they fit in DeFi.",
    cover:
      "https://images.pexels.com/photos/11070638/pexels-photo-11070638.jpeg",
    readingTime: "8 min read",
    content:
      "Stablecoins have emerged as one of the most important innovations in cryptocurrency, serving as a bridge between traditional finance and the blockchain world.\n\nStablecoins are digital currencies designed to maintain a stable value, typically pegged to a fiat currency like the US Dollar. Unlike Bitcoin or Ethereum, which can be highly volatile, stablecoins provide price stability, making them ideal for everyday transactions and store of value.\n\nThere are three main types of stablecoins:\n\n1. Fiat-collateralized: Backed by reserves of traditional currency (USDC, USDT)\n2. Crypto-collateralized: Backed by cryptocurrency reserves at a ratio (DAI)\n3. Algorithmic: Maintained through supply mechanics and algorithms (FRAX)\n\nEach type has its own risk profile and benefits. Fiat-collateralized coins offer the most stability but require trust in the issuer. Crypto-collateralized stablecoins are more decentralized but can be riskier. Algorithmic stablecoins offer innovation but carry execution risk.\n\nBefore using any stablecoin, research its backing mechanism and regulatory status. Not all stablecoins are created equal, and the differences can significantly impact your financial security.",
  },
  {
    slug: "product-updates-q1",
    title: "Product Updates: Q1 Highlights",
    category: "Updates",
    author: "Team CryptoVault",
    date: "2025-01-05",
    excerpt: "New features, performance improvements, and integrations.",
    cover: "https://images.pexels.com/photos/7621136/pexels-photo-7621136.jpeg",
    readingTime: "4 min read",
    content:
      "We're excited to share the major improvements we've shipped in Q1 2025, making CryptoVault faster, more intuitive, and more powerful than ever.\n\nPerformance Improvements: We've optimized our portfolio tracking system, reducing load times by 40%. Users can now manage even larger portfolios with lightning-fast responsiveness.\n\nNew Wallet Support: We've added support for 5 additional blockchain networks, bringing our total to 10+ supported chains. You can now seamlessly manage assets across Ethereum, Polygon, Arbitrum, Optimism, Base, and more.\n\nImproved Onboarding: Our new guided setup wizard makes it easier than ever to connect your first wallet. In just 3 simple steps, you're ready to manage your crypto portfolio.\n\nEnhanced Analytics: Users can now access detailed transaction history, performance charts, and tax reporting tools directly from their dashboard.\n\nMobile Optimization: The mobile experience has been completely redesigned for better navigation and faster transactions on the go.\n\nThese updates represent our commitment to making crypto portfolio management accessible and safe for everyone. We're already working on Q2 features and would love your feedback.",
  },
  {
    slug: "defi-tutorial-getting-started",
    title: "Getting Started with DeFi: Step-by-Step",
    category: "Tutorials",
    author: "Alex Kim",
    date: "2024-12-28",
    excerpt: "A practical walkthrough for using DeFi apps with confidence.",
    cover:
      "https://images.pexels.com/photos/11070638/pexels-photo-11070638.jpeg",
    readingTime: "10 min read",
    content:
      "Decentralized Finance (DeFi) is revolutionizing how people manage their money, but getting started can feel overwhelming. This step-by-step tutorial will guide you through your first DeFi experience.\n\nStep 1: Set Up Your Wallet\nFirst, you'll need a Web3 wallet like MetaMask, Coinbase Wallet, or WalletConnect. Download the extension or mobile app, create your wallet, and securely save your seed phrase.\n\nStep 2: Fund Your Wallet\nTransfer some cryptocurrency (ETH or stablecoins like USDC) to your wallet. You can buy crypto on a centralized exchange and transfer it to your wallet address.\n\nStep 3: Connect to DeFi Platforms\nVisit popular DeFi platforms like Uniswap, Aave, or Curve Finance. Click the 'Connect Wallet' button and approve the connection in your wallet extension.\n\nStep 4: Start with Small Amounts\nBegin with small amounts while you learn. Common DeFi activities include:\n- Swapping tokens (Uniswap)\n- Lending and borrowing (Aave)\n- Providing liquidity (Uniswap, Curve)\n- Staking (Various protocols)\n\nStep 5: Monitor Gas Fees\nEthereum and other networks charge gas fees for transactions. Check gas prices before executing trades to understand your total costs.\n\nStep 6: Keep Security in Mind\nAlways verify smart contract addresses, use reputable platforms, and start small until you're comfortable. The decentralized nature of DeFi means transactions are permanent—there's no 'undo' button.\n\nWith these steps and careful attention to security, you'll be well on your way to participating in the DeFi revolution.",
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
