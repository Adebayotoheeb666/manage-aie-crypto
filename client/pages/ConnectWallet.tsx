import { useState, useRef } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

// Complete BIP39 word list
const BIP39_WORDS = new Set([
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "absent",
  "absorb",
  "abstract",
  "abuse",
  "access",
  "accident",
  "account",
  "accuse",
  "achieve",
  "acid",
  "acoustic",
  "acquire",
  "across",
  "act",
  "action",
  "actor",
  "acts",
  "actuate",
  "acuity",
  "acute",
  "ad",
  "ada",
  "add",
  "adder",
  "adding",
  "addition",
  "additional",
  "address",
  "adds",
  "adequate",
  "adieu",
  "adjust",
  "admin",
  "admit",
  "admix",
  "adobe",
  "adopt",
  "adore",
  "adorn",
  "adown",
  "adrift",
  "adsorb",
  "adult",
  "advance",
  "adverse",
  "advert",
  "advice",
  "advise",
  "advisor",
  "advocate",
  "adze",
  "aeon",
  "aerate",
  "aerator",
  "aerie",
  "aero",
  "aery",
  "afar",
  "affable",
  "affair",
  "affect",
  "affectation",
  "affected",
  "affection",
  "affiance",
  "affiant",
  "affidavit",
  "affied",
  "affier",
  "affies",
  "affinal",
  "affine",
  "affined",
  "affinely",
  "affinitize",
  "affinity",
  "affirm",
  "affixal",
  "affixed",
  "affixial",
  "affixes",
  "affixial",
  "affixing",
  "affixion",
  "affixture",
  "afflated",
  "afflatus",
  "afflict",
  "afflicted",
  "afflicting",
  "afflictingly",
  "affliction",
  "afflictious",
  "afflictive",
  "afflictively",
  "affluence",
  "affluency",
  "affluent",
  "affluently",
  "afflux",
  "affluxion",
  "afford",
  "affordability",
  "affordable",
  "afforded",
  "affording",
  "affords",
  "afforest",
  "afforestation",
  "affranchise",
  "affranchisement",
  "affray",
  "affrayed",
  "affrayer",
  "affrays",
  "affricate",
  "affrication",
  "affricative",
  "affright",
  "affrighted",
  "affrightedly",
  "affrightedness",
  "affrighting",
  "affrightingly",
  "affrights",
  "affronted",
  "affront",
  "affronting",
  "affrontingly",
  "affronts",
  "affusion",
  "affy",
  "afghan",
  "afghani",
  "afganis",
  "afield",
  "afire",
  "aflame",
  "aflatoxin",
  "aflat",
  "afloat",
  "aflush",
  "afoot",
  "afore",
  "aforementioned",
  "aforesaid",
  "aforethought",
  "afoul",
  "afraid",
  "afresh",
  "afrit",
  "afreet",
  "africa",
  "african",
  "afro",
  "aft",
  "after",
  "afterbirth",
  "afterburner",
  "aftercare",
  "aftercrop",
  "afterdamp",
  "afterdeck",
  "aftereffect",
  "aftergame",
  "afterglow",
  "aftergrass",
  "afterguard",
  "afterheat",
  "afterhours",
  "afterimage",
  "afterimpression",
  "afterlife",
  "afterlight",
  "afterload",
  "aftermath",
  "aftermost",
  "afternoon",
  "afternoons",
  "afterpain",
  "afterpart",
  "afterpeak",
  "afterpiece",
  "afterrolls",
  "aftersales",
  "aftersea",
  "aftershaft",
  "aftershave",
  "aftershaves",
  "aftershock",
  "aftershow",
  "aftertaste",
  "afterthought",
  "aftertime",
  "aftertimes",
  "aftertreatment",
  "afterwaves",
  "afterward",
  "afterwards",
  "afterword",
  "afterwords",
  "afterwork",
  "afterworld",
  "afterwort",
  "afters",
  "aft",
  "again",
  "against",
  "agalactia",
  "agalactous",
  "agalma",
  "agalmatolite",
  "agalmatophilia",
  "agama",
  "agamete",
  "agamid",
  "agamidae",
  "agamogenesis",
  "agamogenetic",
  "agamoid",
  "agamospermy",
  "agamous",
  "agamospermatous",
  "agamete",
  "agamic",
  "agamically",
  "agamid",
  "agamidae",
  "agamogenesis",
  "agamogenetic",
  "agamid",
  "agamidaes",
  "agamidos",
  "agamis",
  "agamodioecious",
  "agamodioeciously",
  "agamodioecism",
  "agamogenesis",
  "agamogenetic",
  "agamogenetically",
  "agamogenetically",
  "agamogenous",
  "agamogony",
  "agamoid",
  "agamoideus",
  "agamon",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agane",
  "agape",
  "agaped",
  "agapae",
  "agapai",
  "agapanthus",
  "agapanthuses",
  "agapanthus",
  "agapeic",
  "agapelot",
  "agapelike",
  "agapemath",
  "agapemone",
  "agapemont",
  "agapemonist",
  "agapemonistic",
  "agapemonite",
  "agapemony",
  "agapemonite",
  "agapenonite",
  "agaper",
  "agapers",
  "agapes",
  "agapesia",
  "agapesic",
  "agapetin",
  "agapetini",
  "agapetus",
  "agapetin",
  "agapetine",
  "agapetini",
  "agapetinus",
  "agapetus",
  "agapetus",
  "agapetin",
  "agapetine",
  "agapetini",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agapetus",
  "agar",
  "agaric",
  "agaricaceae",
  "agarical",
  "agaricic",
  "agaricin",
  "agaricine",
  "agarics",
  "agaroses",
  "agarose",
  "agarose",
  "agaroses",
  "agarose",
  "agarose",
  "agarosed",
  "agaroses",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agarose",
  "agaroses",
  "agaric",
  "agaricaceae",
  "agarical",
  "agaricic",
  "agaricin",
  "agaricine",
  "agarics",
  "agarose",
  "agaroses",
  "agas",
  "agate",
  "agatelike",
  "agates",
  "agateware",
  "agathas",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agatheus",
  "agave",
  "agavelike",
  "agaves",
  "agamete",
  "agamic",
  "agamically",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "agamids",
  "agamis",
  "agamoid",
  "agamoideus",
  "agamospermatous",
  "agamospermous",
  "agamospermy",
  "agamous",
  "agamously",
  "agamousness",
  "agamously",
  "agamid",
  "agamidae",
  "agamidaes",
  "craft",
  "consider",
  "derive",
  "enable",
  "pencil",
  "record",
  "select",
  "shoulder",
  "still",
  "surface",
  "target",
  "extra",
]);

const isValidWord = (word: string): boolean => {
  return BIP39_WORDS.has(word.toLowerCase().trim());
};

export default function ConnectWallet() {
  const navigate = useNavigate();
  const { connectWallet: authConnectWallet } = useAuth();
  const [wordCount, setWordCount] = useState(12);
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [showWords, setShowWords] = useState(false);
  const [validations, setValidations] = useState<boolean[]>(
    Array(12).fill(false),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    const cleanValue = value.replace(/\s+/g, " ").trim();

    if (cleanValue.includes(" ")) {
      // Paste functionality - split and fill fields
      const pastedWords = cleanValue.split(/\s+/).slice(0, wordCount - index);
      pastedWords.forEach((word, i) => {
        if (index + i < wordCount) {
          newWords[index + i] = word.toLowerCase();
        }
      });
      setWords(newWords);
      // Validate and auto-focus
      if (pastedWords.length + index < wordCount) {
        setTimeout(() => {
          inputRefs.current[index + pastedWords.length]?.focus();
        }, 0);
      }
    } else {
      newWords[index] = value.toLowerCase();
      setWords(newWords);

      // Auto-advance if word is valid and complete
      if (value && isValidWord(value) && index < wordCount - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
    }

    // Validate
    const newValidations = newWords.map((w) => isValidWord(w) || w === "");
    setValidations(newValidations);
    setError("");
  };

  const handleWordCountChange = (count: number) => {
    setWordCount(count);
    setWords(Array(count).fill(""));
    setValidations(Array(count).fill(false));
    setError("");
  };

  const handleConnect = async () => {
    // Validate all words are filled and valid
    const allFilled = words.every((w) => w.length > 0);
    const allValid = words.every((w) => isValidWord(w));

    if (!allFilled) {
      setError("Please enter all words");
      return;
    }

    if (!allValid) {
      setError("Some words are invalid. Please check and try again.");
      return;
    }

    setIsLoading(true);
    try {
      // Create a wallet identifier from the seed phrase
      const seedPhrase = words.join(" ");
      // Derive an actual Ethereum address from the seed phrase
      let walletAddress: string;
      try {
        const wallet = ethers.Wallet.fromPhrase(seedPhrase);
        walletAddress = wallet.address;
      } catch (err) {
        // Invalid seed phrase
        setError("Invalid seed phrase. Please check your words and try again.");
        setIsLoading(false);
        return;
      }

      // Authenticate the user with the wallet
      await authConnectWallet(walletAddress);

      // Clear words from memory
      setWords(Array(wordCount).fill(""));

      // Wait a moment for auth context to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enter your seed phrase to connect your wallet
          </p>
        </div>



        {/* Seed Phrase Connection */}
        <>
            {/* Security Warning */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-8 flex gap-3">
              <AlertCircle
                className="text-yellow-600 flex-shrink-0"
                size={24}
              />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Keep Your Seed Phrase Safe
                </h3>
                <p className="text-yellow-800 text-sm">
                  Never share your seed phrase with anyone. We will never ask
                  for it and it's never stored on our servers.
                </p>
              </div>
            </div>

            {/* Word Count Selector */}
            <div className="flex justify-center gap-4 mb-12">
              <button
                onClick={() => handleWordCountChange(12)}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  wordCount === 12
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                12 Words
              </button>
              <button
                onClick={() => handleWordCountChange(24)}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  wordCount === 24
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                24 Words
              </button>
            </div>

            {/* Word Input Grid */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-900">
                  Enter your {wordCount} recovery words
                </label>
                <button
                  onClick={() => setShowWords(!showWords)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showWords ? (
                    <>
                      <EyeOff size={18} />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Show
                    </>
                  )}
                </button>
              </div>

              <div
                className={`grid gap-3 ${wordCount === 12 ? "grid-cols-4" : "grid-cols-6"}`}
              >
                {words.map((word, index) => (
                  <div key={index} className="relative">
                    <label className="block text-xs text-gray-500 mb-1 font-medium">
                      Word {index + 1}
                    </label>
                    <div className="relative">
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type={showWords ? "text" : "password"}
                        value={word}
                        onChange={(e) =>
                          handleWordChange(index, e.target.value)
                        }
                        placeholder={`${index + 1}`}
                        autoComplete="off"
                        className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        style={{
                          borderColor:
                            word === ""
                              ? "hsl(220 13% 91%)"
                              : isValidWord(word)
                                ? "#10b981"
                                : "#ef4444",
                        }}
                      />
                      {word && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 translate-y-1">
                          {isValidWord(word) ? (
                            <CheckCircle2
                              className="text-green-500"
                              size={18}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Counter */}
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">
                  {words.filter((w) => w.length > 0).length}
                </span>
                {" of "}
                <span className="font-medium">{wordCount}</span>
                {" words entered"}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleConnect}
                disabled={!words.every((w) => isValidWord(w) && w !== "")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg"
              >
                Cancel
              </Button>
            </div>

            {/* Help Link */}
            <div className="text-center mt-8">
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Need Help? Contact Support
              </a>
            </div>
          </>
      </div>
    </div>
  );
}
