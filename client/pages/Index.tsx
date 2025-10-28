import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/AnimatedButton";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  const handleConnectWallet = () => {
    navigate("/connect-wallet");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">₿</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CryptoVault</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#security" className="text-gray-600 hover:text-gray-900">
              Security
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900">
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6"
            >
              Manage Your{" "}
              <span className="text-blue-600">Crypto Portfolio</span>{" "}
              Effortlessly
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Connect your Coinbase wallet securely, track your holdings in
              real-time, and withdraw funds with confidence. Your crypto, your
              control.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <AnimatedButton
                onClick={handleConnectWallet}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto rounded-lg flex items-center justify-center gap-2"
              >
                <span>Link Your Coinbase Wallet</span>
                <ArrowRight size={20} />
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="lg"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 text-lg px-8 py-6 h-auto rounded-lg"
              >
                Learn More
              </AnimatedButton>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-6"
            >
              <div>
                <p className="text-3xl font-bold text-gray-900">10K+</p>
                <p className="text-gray-600">Active Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">$2B+</p>
                <p className="text-gray-600">Assets Managed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">99.9%</p>
                <p className="text-gray-600">Uptime</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -20 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="relative w-full max-w-md"
            >
              {/* Dashboard Preview Mock */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-6 border border-blue-100">
                {/* Mockup Card */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">
                      Portfolio Value
                    </h3>
                    <span className="text-green-600 text-sm font-medium">
                      ↑ 12.5%
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    $42,847.50
                  </div>

                  {/* Mini Chart */}
                  <div className="h-32 bg-gradient-to-t from-blue-100 to-transparent rounded-lg flex items-end justify-between px-4 pt-4">
                    {[40, 50, 45, 60, 55, 70, 65].map((height, i) => (
                      <div
                        key={i}
                        className="w-2 bg-blue-600 rounded-full"
                        style={{ height: `${(height / 70) * 100}%` }}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-600">BTC</p>
                      <p className="font-semibold text-gray-900">0.542</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-600">ETH</p>
                      <p className="font-semibold text-gray-900">2.148</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg">
                <TrendingUp size={24} />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white rounded-full p-4 shadow-lg">
                <Shield size={24} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
            Why Choose CryptoVault?
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Secure, fast, and user-friendly crypto management
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-8 border border-blue-100 hover:shadow-lg transition"
            >
              <div className="bg-blue-100 rounded-lg p-4 w-fit mb-4">
                <Shield className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bank-Level Security
              </h3>
              <p className="text-gray-600">
                Your seed phrase is never stored. SSL encryption and secure
                session management protect your data.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-8 border border-blue-100 hover:shadow-lg transition"
            >
              <div className="bg-blue-100 rounded-lg p-4 w-fit mb-4">
                <TrendingUp className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-Time Portfolio
              </h3>
              <p className="text-gray-600">
                Track your holdings, view detailed transaction history, and
                monitor price changes instantly.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-8 border border-blue-100 hover:shadow-lg transition"
            >
              <div className="bg-blue-100 rounded-lg p-4 w-fit mb-4">
                <Zap className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fast Withdrawals
              </h3>
              <p className="text-gray-600">
                Seamless withdrawal process with network fee estimation and
                instant confirmation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Enterprise-Grade Security
              </h2>
              <ul className="space-y-4">
                {[
                  "HTTPS encryption for all connections",
                  "Seed phrases never stored or logged",
                  "15-minute session timeout for safety",
                  "Rate limiting on all API endpoints",
                  "Email verification for withdrawals",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-3"
                  >
                    <span className="text-blue-600 font-bold">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-12 text-white shadow-xl"
            >
              <p className="text-lg mb-4">
                Security is our top priority. We implement industry-leading
                practices to keep your crypto safe.
              </p>
              <p className="text-sm opacity-90">
                All withdrawals require verification and are irreversible by
                design to protect your assets.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4"
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Crypto?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Connect your Coinbase wallet in seconds and start managing your
            portfolio today.
          </p>
          <AnimatedButton
            onClick={handleConnectWallet}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto rounded-lg font-semibold"
          >
            Link Your Coinbase Wallet
          </AnimatedButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {[
              {
                title: "Product",
                links: ["Features", "Security", "Pricing"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers"],
              },
              {
                title: "Legal",
                links: ["Terms of Service", "Privacy Policy", "Disclaimer"],
              },
              {
                title: "Support",
                links: ["Help Center", "Contact Us", "Status Page"],
              },
            ].map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="font-semibold text-gray-900 mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2 text-gray-600">
                  {section.links.map((link, linkIdx) => (
                    <motion.li
                      key={linkIdx}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a href="#" className="hover:text-gray-900">
                        {link}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t border-blue-100 pt-8 text-center text-gray-600"
          >
            <p>&copy; 2025 CryptoVault. All rights reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
