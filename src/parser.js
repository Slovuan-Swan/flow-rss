export default (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    const error = new Error("Invalid RSS");
    error.isParserError = true;
    throw error;
  }

  // Универсальный поиск: сначала пытаемся найти внутри channel (для живых фидов)
  // Если тега channel нет (в плоских моках Хекслета), ищем от корня документа
  const channel = doc.querySelector("channel") || doc;

  const feedTitleEl = channel.querySelector("title");
  const feedDescriptionEl = channel.querySelector("description");

  if (!feedTitleEl) {
    const error = new Error("Invalid RSS structure");
    error.isParserError = true;
    throw error;
  }

  const feedTitle = feedTitleEl.textContent;
  const feedDescription = feedDescriptionEl
    ? feedDescriptionEl.textContent
    : "";

  const items = doc.querySelectorAll("item");
  const posts = Array.from(items).map((item) => {
    const titleEl = item.querySelector("title");
    const linkEl = item.querySelector("link");
    const descriptionEl = item.querySelector("description");

    return {
      title: titleEl ? titleEl.textContent : "Без названия",
      link: linkEl ? linkEl.textContent : "#",
      description: descriptionEl ? descriptionEl.textContent : "",
    };
  });

  return {
    feed: { title: feedTitle, description: feedDescription },
    posts,
  };
};
