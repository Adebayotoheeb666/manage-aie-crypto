import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@shared/lib/supabase";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast({ title: "Please fill all fields" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({ name, email, subject, message });
      if (error) throw error;
      toast({
        title: "Message sent!",
        description: "We'll get back to you soon.",
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast({
        title: "Failed to send",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

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
            <a href="/help" className="hover:text-gray-900">
              Help
            </a>
            <a href="/blog" className="hover:text-gray-900">
              Blog
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            We’re Here to Help
          </h1>
          <p className="text-gray-600 mt-2">
            Reach out for support, collaborations, or inquiries.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:col-span-2 bg-white border border-blue-100 rounded-xl p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-700">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-700">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message"
                className="mt-1 min-h-[140px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-xs text-gray-500">
              All messages are encrypted with SSL/TLS.
            </div>
            <Button
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </motion.form>

        {/* Quick Info */}
        <div className="space-y-4">
          <div className="bg-white border border-blue-100 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Contacts</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                Support:{" "}
                <a href="mailto:support@yourapp.com" className="text-blue-600">
                  support@yourapp.com
                </a>
              </li>
              <li>
                Partnerships:{" "}
                <a
                  href="mailto:partnerships@yourapp.com"
                  className="text-blue-600"
                >
                  partnerships@yourapp.com
                </a>
              </li>
              <li>
                Community:{" "}
                <a href="#" className="text-blue-600">
                  Join Telegram/Discord
                </a>
              </li>
            </ul>
          </div>
          <div className="bg-white border border-blue-100 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Office</h3>
            <p className="text-sm text-gray-700">
              CryptoVault Inc.
              <br />
              123 Web3 Blvd, Suite 100
              <br />
              San Francisco, CA
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Map embed available if needed.
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-blue-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 CryptoVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
