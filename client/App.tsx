import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import Index from "./pages/Index";
import ConnectWallet from "./pages/ConnectWallet";
import Dashboard from "./pages/Dashboard";
import Withdraw from "./pages/Withdraw";
import WithdrawReview from "./pages/WithdrawReview";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import DatabaseStatus from "./pages/DatabaseStatus";
import SchemaVerification from "./pages/SchemaVerification";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WalletProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/connect-wallet" element={<ConnectWallet />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/withdraw/review" element={<WithdrawReview />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<Help />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/database-status" element={<DatabaseStatus />} />
                <Route
                  path="/schema-verification"
                  element={<SchemaVerification />}
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
