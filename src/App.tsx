import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Book, 
  PenTool, 
  MessageSquare, 
  Plus, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Star,
  Feather,
  Quote,
  Trash2
} from 'lucide-react';

interface Content {
  id: number;
  title: string;
  body: string;
  type: 'poetry' | 'novel';
  pdf_data?: string;
  created_at: string;
}

interface Review {
  id: number;
  name: string;
  comment: string;
  rating: number;
  created_at: string;
}

export default function App() {
  const [contents, setContents] = useState<Content[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newType, setNewType] = useState<'poetry' | 'novel'>('poetry');
  const [newPdfData, setNewPdfData] = useState<string | null>(null);
  
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  useEffect(() => {
    fetchContent();
    fetchReviews();
    generateSignature();
  }, []);

  const generateSignature = async () => {
    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: "A minimalist and elegant writer's signature logo. The text 'JAX ELRIC' is written in a sophisticated, clean vintage serif font (like a classic typewriter or old book title). Below the name, a thin, sharp horizontal line. Under the line, the words 'A WRITER' in a clean, minimalist, widely spaced sans-serif font. The background is a solid, warm vintage cream or light beige color (#F5F2ED). The style is professional, high-end, and clean black ink on paper.",
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setSignatureUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to generate signature image", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setContents(data);
    } catch (err) {
      console.error("Failed to fetch content", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newTitle, 
        body: newBody, 
        type: newType, 
        pdfData: newPdfData,
        adminKey 
      }),
    });
    if (res.ok) {
      setNewTitle('');
      setNewBody('');
      setNewPdfData(null);
      fetchContent();
      alert('Content uploaded successfully!');
    } else {
      alert('Upload failed. Check your admin key.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPdfData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this work?')) return;

    const res = await fetch(`/api/content/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    });

    if (res.ok) {
      fetchContent();
    } else {
      const errorData = await res.json();
      alert(`Delete failed: ${errorData.error || 'Unknown error'}`);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchReviews();
    } else {
      alert('Failed to delete review.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: reviewName, comment: reviewComment, rating: reviewRating }),
    });
    if (res.ok) {
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
      fetchReviews();
      alert('Thank you for your review!');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey === 'jaxelricweb') {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert('Invalid admin key');
    }
  };

  return (
    <div className="min-h-screen selection:bg-stone-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Feather className="w-6 h-6 text-stone-800" />
            <span className="font-serif text-2xl font-semibold tracking-tight text-stone-900">Jax Elric</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="text-stone-500 hover:text-stone-900 transition-colors"
            >
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-stone-900 tracking-tight mb-4">
            WELCOME TO JAX ELRIC'S PAGE
          </h1>
          <div className="w-24 h-1 bg-stone-900 mx-auto rounded-full"></div>
        </motion.div>

        {/* About Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24 text-center max-w-3xl mx-auto"
        >
          <h2 className="font-serif text-2xl mb-6 uppercase tracking-[0.3em] text-stone-400 font-medium">About Jax Elric</h2>
          <p className="literary-text text-xl text-stone-600 leading-relaxed">
            JAX ELRIC is a poet and non-fiction writer who turns thoughts and emotions into words. His writing explores human emotions, reality, and the silent truths people often leave unspoken. Through poems and non-fiction, he aims to create stories that connect deeply with the reader and stay with them long after the last line. Beyond writing, he is a passionate reader who believes that words have the power to change perspectives and give meaning to feelings we cannot explain.
          </p>
          <div className="mt-12 flex justify-center">
            <div className="w-16 h-px bg-stone-200"></div>
          </div>
        </motion.section>

        {/* Admin Login Modal */}
        <AnimatePresence>
          {showAdminLogin && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12 p-8 rounded-3xl glass-card max-w-md mx-auto"
            >
              <h2 className="font-serif text-2xl mb-4 text-center">Admin Access</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter Admin Key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all"
                />
                <button className="w-full py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors">
                  Unlock Dashboard
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Upload Form */}
        {isAdmin && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16 p-8 rounded-3xl bg-stone-50 border border-stone-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-6 h-6" />
              <h2 className="font-serif text-3xl">New Publication</h2>
            </div>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-500 uppercase tracking-wider">Title</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    placeholder="The Whispering Pines..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-500 uppercase tracking-wider">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'poetry' | 'novel')}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  >
                    <option value="poetry">Poetry</option>
                    <option value="novel">Novel / Prose</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-500 uppercase tracking-wider">Upload PDF (Optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-500 uppercase tracking-wider">Content</label>
                <textarea
                  required
                  rows={8}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 font-serif text-lg"
                  placeholder="Begin your masterpiece here..."
                />
              </div>
              <button className="px-8 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-200">
                Publish Work
              </button>
            </form>
          </motion.section>
        )}

        {/* Content Display */}
        <section className="space-y-24">
          {/* Poetry Section */}
          <div>
            <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
              <PenTool className="w-6 h-6 text-stone-400" />
              <h2 className="font-serif text-4xl italic">Poetry</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {contents.filter(c => c.type === 'poetry').length === 0 ? (
                <p className="text-stone-400 italic">No poetry published yet.</p>
              ) : (
                contents.filter(c => c.type === 'poetry').map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedContent(item)}
                    className="p-8 rounded-3xl glass-card cursor-pointer group relative"
                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 transition-colors z-10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <h3 className="font-serif text-2xl mb-4 group-hover:text-stone-600 transition-colors">{item.title}</h3>
                    <p className="font-serif text-stone-500 line-clamp-4 leading-relaxed italic">
                      {item.body}
                    </p>
                    <div className="mt-6 flex items-center text-stone-400 text-sm gap-2">
                      <span>Read more</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Novels Section */}
          <div>
            <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
              <Book className="w-6 h-6 text-stone-400" />
              <h2 className="font-serif text-4xl italic">Prose & Novels</h2>
            </div>
            <div className="space-y-8">
              {contents.filter(c => c.type === 'novel').length === 0 ? (
                <p className="text-stone-400 italic">No prose published yet.</p>
              ) : (
                contents.filter(c => c.type === 'novel').map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedContent(item)}
                    className="p-8 rounded-3xl glass-card cursor-pointer flex flex-col md:flex-row gap-8 items-start relative group"
                  >
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 transition-colors z-10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex-1">
                      <h3 className="font-serif text-3xl mb-4">{item.title}</h3>
                      <p className="font-serif text-stone-600 line-clamp-3 text-lg leading-relaxed">
                        {item.body}
                      </p>
                      <div className="mt-6 flex items-center text-stone-400 text-sm gap-2">
                        <span>Continue reading</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Signature Image Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 mb-12 flex justify-center"
        >
          <div className="max-w-md w-full px-6">
            {isGeneratingImage ? (
              <div className="aspect-square w-full bg-stone-50 animate-pulse rounded-2xl flex items-center justify-center">
                <p className="text-stone-400 font-serif italic">Crafting signature...</p>
              </div>
            ) : signatureUrl ? (
              <img 
                src={signatureUrl} 
                alt="Jax Elric Signature" 
                className="w-full h-auto mix-blend-multiply opacity-90 rounded-2xl shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center">
                <div className="w-full h-px bg-stone-200 mb-8"></div>
                <p className="text-stone-400 font-serif italic tracking-widest text-sm">
                  Jax Elric — A Writer
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Content Modal */}
        <AnimatePresence>
          {selectedContent && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setSelectedContent(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[80vh] overflow-y-auto p-12 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="max-w-xl mx-auto">
                  <div className="text-center mb-12">
                    <span className="text-stone-400 uppercase tracking-widest text-xs font-semibold mb-4 block">
                      {selectedContent.type}
                    </span>
                    <h2 className="font-serif text-5xl mb-6">{selectedContent.title}</h2>
                    <div className="w-12 h-px bg-stone-200 mx-auto"></div>
                  </div>
                  <div className="literary-text text-xl text-stone-800 whitespace-pre-wrap">
                    {selectedContent.body}
                  </div>
                  {selectedContent.pdf_data && (
                    <div className="mt-12 p-6 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Book className="w-6 h-6 text-stone-400" />
                        <span className="font-medium text-stone-900">PDF Version Available</span>
                      </div>
                      <a 
                        href={selectedContent.pdf_data} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors text-sm"
                      >
                        Read PDF
                      </a>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedContent(null)}
                    className="mt-16 w-full py-4 border border-stone-200 rounded-2xl text-stone-500 hover:bg-stone-50 transition-colors"
                  >
                    Close Reading
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews Section */}
        <section className="mt-32 pt-16 border-t border-stone-100">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-6 h-6 text-stone-400" />
                <h2 className="font-serif text-3xl italic">Reader Reviews</h2>
              </div>
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-stone-400 italic">No reviews yet. Be the first to share your thoughts.</p>
                ) : (
                  reviews.map((review) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 rounded-2xl bg-stone-50 border border-stone-100 relative group"
                    >
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="absolute top-4 right-4 p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-medium text-stone-900">{review.name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'fill-stone-800 text-stone-800' : 'text-stone-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-stone-600 leading-relaxed italic">"{review.comment}"</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-80">
              <div className="p-8 rounded-3xl bg-stone-900 text-white sticky top-24">
                <h3 className="font-serif text-2xl mb-6">Leave a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <input
                      required
                      placeholder="Your Name"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReviewRating(num)}
                          className="p-1"
                        >
                          <Star className={`w-5 h-5 ${num <= reviewRating ? 'fill-white text-white' : 'text-white/20'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      required
                      placeholder="Your thoughts..."
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <button className="w-full py-3 bg-white text-stone-900 rounded-xl font-medium hover:bg-stone-100 transition-colors">
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-stone-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Quote className="w-4 h-4 text-stone-300" />
        </div>
        <p className="text-stone-400 text-sm tracking-widest uppercase">
          © {new Date().getFullYear()} Jax Elric • Crafted for the Soul
        </p>
      </footer>
    </div>
  );
}
