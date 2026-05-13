export default async function handler(req, res) {
  const CHANNEL_ID = "UCjMAxo7zHyzNNAhJ_xebjzg";
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

  try {
    const response = await fetch(rssUrl);
    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

    const xml = await response.text();
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!match) throw new Error("No videoId found in RSS");

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ videoId: match[1] });
  } catch (err) {
    console.error("[latest-video]", err.message);
    return res.status(500).json({ error: "Could not fetch latest video" });
  }
}
