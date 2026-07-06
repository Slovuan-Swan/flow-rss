export default (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");
  const parseError = doc.querySelector("parsererror");

  if (parseError) {
    const error = new Error("Invalid RSS");
    error.isParserError = true;
    throw error;
  }

  const feedTitle = doc.querySelector("channel > title").textContent;
  const feedDescription = doc.querySelector(
    "channel > description",
  ).textContent;

  const items = doc.querySelectorAll("item");
  const posts = Array.from(items).map((item) => {
    const title = item.querySelector("title").textContent;
    const description = item.querySelector("description").textContent;
    const link = item.querySelector("link").textContent;
    return { title, description, link };
  });

  return {
    feed: { title: feedTitle, description: feedDescription },
    posts,
  };
};
