export default async function handler(req, res) {
  const { subreddit } = req.query;

  if (!subreddit) {
    return res.status(400).json({
      error: "Subreddit is required",
    });
  }

  try {
    const response = await fetch(
      `https://www.reddit.com/r/${encodeURIComponent(
        subreddit
      )}/hot.json?limit=50`,
      {
        headers: {
          "User-Agent": "subreddit-vibe-check/1.0",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch subreddit",
      });
    }

    const data = await response.json();

    const posts = data.data.children.map(({ data }) => ({
      id: data.id,
      title: data.title,
      score: data.score,
      comments: data.num_comments,
      author: data.author,
      permalink: `https://www.reddit.com${data.permalink}`,
    }));

    return res.status(200).json(posts);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}