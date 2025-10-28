import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Accessibility,
  Users,
  ArrowRight,
} from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      title: "Transparency",
      icon: ShieldCheck,
      desc: "Clear communication and open operations across our platform.",
    },
    {
      title: "Security",
      icon: Lock,
      desc: "Best-in-class security practices at every layer of the stack.",
    },
    {
      title: "Innovation",
      icon: Sparkles,
      desc: "Relentless iteration to deliver delightful, modern tools.",
    },
    {
      title: "Accessibility",
      icon: Accessibility,
      desc: "Crypto made simple and inclusive for everyone.",
    },
    {
      title: "Community",
      icon: Users,
      desc: "We listen, build with, and empower our users.",
    },
  ];

  const timeline = [
    {
      year: "2023",
      title: "Founded",
      subtitle: "Built the first MVP",
      stat: "Founded in 2023",
    },
    {
      year: "2024",
      title: "Growth",
      subtitle: "10,000+ active users",
      stat: "10,000+ active users",
    },
    {
      year: "2024 Q4",
      title: "Scale",
      subtitle: "$50M+ volume processed",
      stat: "$50M+ total volume",
    },
    {
      year: "2025",
      title: "Integrations",
      subtitle: "10+ blockchains",
      stat: "10+ chains supported",
    },
  ];

  const team = [
    { name: "Ava Collins", role: "CEO", img: "/placeholder.svg" },
    { name: "Liam Chen", role: "CTO", img: "/placeholder.svg" },
    { name: "Noah Patel", role: "Lead Developer", img: "/placeholder.svg" },
    { name: "Mia Rodriguez", role: "Head of Product", img: "/placeholder.svg" },
    { name: "Ethan Park", role: "Security Engineer", img: "/placeholder.svg" },
    { name: "Sophia Lee", role: "Design Lead", img: "/placeholder.svg" },
  ];

  const partners = [
    { name: "Coinbase Wallet" },
    { name: "Alchemy" },
    { name: "Chainlink" },
    { name: "WalletConnect" },
  ];

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
            <a href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </a>
            <a href="/blog" className="text-gray-600 hover:text-gray-900">
              Blog
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Empowering the Future of{" "}
              <span className="text-blue-600">Decentralized Finance</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We’re building tools that make crypto simple, secure, and
              accessible to everyone.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto rounded-lg flex items-center gap-2"
            >
              Explore Our Platform <ArrowRight size={18} />
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="h-full"
          >
            <div className="h-full min-h-[280px] rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-2xl p-1">
              <div className="h-full w-full rounded-2xl bg-white/90 backdrop-blur p-8">
                <p className="text-gray-700 text-lg">
                  Secure. Scalable. Human.
                </p>
                <p className="text-gray-500 mt-2">
                  Abstract blockchain patterns with neon highlights for a modern
                  crypto aesthetic.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 border border-blue-100 shadow-sm"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Mission</h3>
            <p className="text-gray-600">
              To simplify digital asset management through innovation and
              transparency.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 border border-blue-100 shadow-sm"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Vision</h3>
            <p className="text-gray-600">
              A world where financial freedom is accessible to all.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {values.map((v) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border border-blue-100 hover:shadow transition"
              >
                <div className="bg-blue-100 w-fit p-3 rounded-lg mb-4">
                  <v.icon className="text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{v.title}</h4>
                <p className="text-gray-600 text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story - timeline */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {timeline.map((t) => (
                <motion.div
                  key={t.year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="w-72 flex-shrink-0 bg-white rounded-xl p-6 border border-blue-100"
                >
                  <p className="text-sm text-blue-600 font-semibold">
                    {t.year}
                  </p>
                  <h4 className="text-xl font-bold text-gray-900 mt-2">
                    {t.title}
                  </h4>
                  <p className="text-gray-600 mt-1">{t.subtitle}</p>
                  <div className="mt-4 text-sm text-gray-700">{t.stat}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">The Team</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {team.map((m) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-4 border border-blue-100 text-center"
              >
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover mb-3"
                />
                <div className="font-semibold text-gray-900">{m.name}</div>
                <div className="text-sm text-gray-600">{m.role}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Partners & Backers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
            {partners.map((p) => (
              <div
                key={p.name}
                className="bg-white border border-blue-100 rounded-xl p-6 text-center text-gray-700 font-medium hover:shadow-sm"
              >
                {p.name}
              </div>
            ))}
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
