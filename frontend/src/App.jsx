import { useState } from "react";
import Sentiment from "sentiment";
import "./App.css";

function App() {
  const [subreddit, setSubreddit] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overallVibe, setOverallVibe] = useState(null);

  const sentiment = new Sentiment();

  const handleVibe = async () => {
    if (!subreddit.trim()) return;

    setLoading(true);
    setError("");
    setPosts([]);
    setOverallVibe(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/reddit/${encodeURIComponent(subreddit)}`);

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Fallback if response is not JSON
      }

      if (!response.ok) {
        throw new Error(data?.error || `Failed to fetch: ${response.statusText}`);
      }

      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data)) throw new Error("Invalid response format");

      let totalScore = 0;

      const analyzedPosts = data.map((post) => {
        const result = sentiment.analyze(post.title);
        totalScore += result.comparative;

        let sentimentLabel = "neutral";
        if (result.comparative > 0.05) sentimentLabel = "positive";
        else if (result.comparative < -0.05) sentimentLabel = "negative";

        return {
          ...post,
          sentimentScore: result.comparative,
          sentimentLabel,
        };
      });

      const avgVibe = analyzedPosts.length > 0 ? totalScore / analyzedPosts.length : 0;

      let overallLabel = "Neutral";
      let overallClass = "neutral";

      if (avgVibe > 0.05) {
        overallLabel = "Positive";
        overallClass = "positive";
      } else if (avgVibe < -0.05) {
        overallLabel = "Negative";
        overallClass = "negative";
      }

      setOverallVibe({
        score: avgVibe.toFixed(2),
        label: overallLabel,
        className: overallClass,
      });
      setPosts(analyzedPosts);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">
          Reddit Vibe Check
        </h1>
      </header>

      <main>
        <div className="search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Enter a subreddit (e.g. reactjs)"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVibe()}
          />
          <button
            className="search-button"
            onClick={handleVibe}
            disabled={loading || !subreddit.trim()}
          >
            {loading ? "Scanning..." : "Analyze"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading">
            <div className="bouncing-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span>Analyzing sentiments...</span>
          </div>
        )}

        {!loading && !overallVibe && posts.length === 0 && !error && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>Enter a subreddit above to get started.</p>
          </div>
        )}

        {!loading && overallVibe && (
          <div className="summary-card">
            <h2 className="summary-title">Overall Vibe Score</h2>
            <div className={`summary-score ${overallVibe.className}`}>
              {overallVibe.score}
            </div>
            <div className="summary-desc">
              Classified as <strong>{overallVibe.label}</strong> based on {posts.length} hot posts
            </div>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-title"
                  >
                    {post.title}
                  </a>
                  <span className={`post-sentiment ${post.sentimentLabel}`}>
                    {post.sentimentLabel}
                  </span>
                </div>
                <div className="post-meta">
                  <div className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    u/{post.author}
                  </div>
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="view-link">
                    View 
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
