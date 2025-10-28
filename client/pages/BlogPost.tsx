import { useParams, useNavigate, Link } from "react-router-dom";
import { BLOG_POSTS, type BlogArticle } from "./Blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, ArrowLeft, ArrowRight } from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const idx = BLOG_POSTS.findIndex((p) => p.slug === slug);
  const post: BlogArticle | undefined = idx >= 0 ? BLOG_POSTS[idx] : undefined;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Article not found</h1>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  const prev = idx > 0 ? BLOG_POSTS[idx - 1] : null;
  const next = idx < BLOG_POSTS.length - 1 ? BLOG_POSTS[idx + 1] : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/blog")}
            className="text-gray-600"
          >
            Back
          </Button>
          <a href="/" className="font-bold text-gray-900">
            CryptoVault
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-2">
          <Badge>{post.category}</Badge>
          <span className="text-xs text-gray-500">
            {new Date(post.date).toLocaleDateString()} • {post.readingTime}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{post.title}</h1>
        <p className="text-gray-600 mb-6">By {post.author}</p>
        <img
          src={post.cover}
          alt={post.title}
          className="w-full h-64 object-cover rounded-xl mb-6 border border-blue-100"
        />

        <article className="prose prose-blue max-w-none">
          <p>{post.content}</p>
        </article>

        <div className="flex items-center gap-3 mt-8">
          <span className="text-sm text-gray-600">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
            className="text-blue-600 hover:text-blue-700"
            target="_blank"
            rel="noreferrer"
          >
            <Twitter size={18} />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            className="text-blue-600 hover:text-blue-700"
            target="_blank"
            rel="noreferrer"
          >
            <Facebook size={18} />
          </a>
        </div>

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <div>
            {prev && (
              <Link
                to={`/blog/${prev.slug}`}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <ArrowLeft size={16} /> {prev.title}
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link
                to={`/blog/${next.slug}`}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                {next.title} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-600">
            <p>Comments</p>
            <p className="text-sm text-gray-500 mt-1">
              Integrate Disqus or Hashnode embed here.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-blue-100 py-10 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 CryptoVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
