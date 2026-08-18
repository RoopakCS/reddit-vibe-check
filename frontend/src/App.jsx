import { useState } from "react";
import Sentiment from "sentiment";

function App() {
  // ── State variables ──────────────────────────────────────────────────────────
  const [subreddit, setSubreddit] = useState("");     // user's input
  const [posts, setPosts] = useState([]);              // analyzed posts list
  const [loading, setLoading] = useState(false);       // loading spinner toggle
  const [error, setError] = useState("");              // error message
  const [overallVibe, setOverallVibe] = useState(null); // summary result

  // Create one instance of the sentiment analyzer
  const sentiment = new Sentiment();

  /**
   * Main function — fetches posts from backend, then runs sentiment
   * analysis on each post title using the "sentiment" npm library.
   */
  const handleVibe = async () => {
    if (!subreddit.trim()) return;

    // Reset everything before a new search
    setLoading(true);
    setError("");
    setPosts([]);
    setOverallVibe(null);

    try {
      // Step 1: Fetch posts from our backend API
      const response = await fetch(
        `/api/reddit/${encodeURIComponent(subreddit)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) throw new Error(data.error);
      if (!Array.isArray(data)) throw new Error("Invalid response format");

      // Step 2: Run sentiment analysis on each post title
      let totalScore = 0;

      const analyzedPosts = data.map((post) => {
        // sentiment.analyze() returns an object with a "comparative" score
        // comparative = score normalized by word count (-1 to +1 range)
        const result = sentiment.analyze(post.title);
        totalScore += result.comparative;

        // Classify the sentiment based on the score
        let sentimentLabel = "neutral";
        if (result.comparative > 0.05) sentimentLabel = "positive";
        else if (result.comparative < -0.05) sentimentLabel = "negative";

        return {
          ...post,
          sentimentScore: result.comparative,
          sentimentLabel,
        };
      });

      // Step 3: Calculate the overall average vibe score
      const avgVibe = analyzedPosts.length > 0
        ? totalScore / analyzedPosts.length
        : 0;

      let overallLabel = "Neutral";
      let overallClass = "neutral";

      if (avgVibe > 0.05) {
        overallLabel = "Positive";
        overallClass = "positive";
      } else if (avgVibe < -0.05) {
        overallLabel = "Negative";
        overallClass = "negative";
      }

      // Step 4: Update the UI with results
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

  // ── UI ────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Header */}
      <header className="header">
        <h1 className="title">
          <span>🔥</span> The Subreddit Vibe Check
        </h1>
        <p className="subtitle">
          Analyze the sentiment of the top 50 hot posts in any subreddit.
        </p>
      </header>

      <main>
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="e.g. javascript, reactjs, aww"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVibe()}
          />
          <button
            className="search-button"
            onClick={handleVibe}
            disabled={loading || !subreddit.trim()}
          >
            {loading ? "Checking..." : "Check Vibe"}
          </button>
        </div>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Loading state */}
        {loading && (
          <div className="loading">
            Scanning posts and calculating vibes...
          </div>
        )}

        {/* Overall vibe summary card */}
        {!loading && overallVibe && (
          <div className="summary-card">
            <h2 className="summary-title">Overall Subreddit Vibe</h2>
            <div className={`summary-score ${overallVibe.className}`}>
              {overallVibe.score}
            </div>
            <div className="summary-desc">
              {overallVibe.label} vibes based on the top {posts.length} posts
            </div>
          </div>
        )}

        {/* Individual post cards */}
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
                  <div className="meta-item">👤 u/{post.author}</div>
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
