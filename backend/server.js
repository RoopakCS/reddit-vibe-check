import express from "express";
import cors from "cors";
import { XMLParser } from "fast-xml-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Required by Reddit API — identifies our app in requests
const USER_AGENT = "web:SubredditVibeCheck:v1.0 (by /u/SheepherderWide1413)";

// Allow frontend (different port) to call this API
app.use(cors());
app.use(express.json());

/**
 * Fetches the top 50 "Hot" posts from a subreddit using Reddit's RSS feed.
 * We use RSS instead of the JSON API because Reddit blocks unauthenticated
 * JSON requests with a 403 error. RSS still works without any login.
 */
async function fetchSubredditPosts(subreddit) {
	// Step 1: Fetch the RSS feed from Reddit
	const response = await fetch(
		`https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.rss?limit=50`,
		{
			headers: { "User-Agent": USER_AGENT },
		},
	);

	if (!response.ok) {
		throw new Error(`Reddit RSS returned ${response.status}`);
	}

	// Step 2: Parse the XML response into a JavaScript object
	const xml = await response.text();
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "@_",
	});
	const parsed = parser.parse(xml);

	// Step 3: Extract the post entries from the parsed feed
	const entries = parsed?.feed?.entry;
	if (!entries) {
		throw new Error("No entries found in RSS feed");
	}

	// Handle edge case: if there's only 1 entry, it won't be an array
	const items = Array.isArray(entries) ? entries : [entries];

	// Step 4: Transform each RSS entry into a clean post object
	return items.map((entry, index) => {
		// Get the Reddit permalink from the entry's links
		const links = Array.isArray(entry.link) ? entry.link : [entry.link];
		const permalink =
			links.find((l) => l["@_href"]?.includes("/r/"))?.["@_href"] || "";

		// Extract author name, removing the "/u/" prefix
		const author = entry.author?.name
			? entry.author.name.replace("/u/", "")
			: "unknown";

		return {
			id: `rss-${index}`,
			title: entry.title || "Untitled",
			author,
			permalink,
		};
	});
}

/**
 * API endpoint: GET /api/reddit/:subreddit
 * Returns an array of post objects for the given subreddit.
 * Example: GET /api/reddit/javascript
 */
app.get("/api/reddit/:subreddit", async (req, res) => {
	const { subreddit } = req.params;

	try {
		const posts = await fetchSubredditPosts(subreddit);
		res.json(posts);
	} catch (error) {
		console.error("Reddit API error:", error);
		res.status(500).json({
			error: "Failed to fetch Reddit posts: " + error.message,
		});
	}
});

app.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});
