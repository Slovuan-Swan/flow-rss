export default (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("DOMParser error details:", parseError.textContent);
    const error = new Error("Invalid RSS");
    error.isParserError = true;
    throw error;
  }

  // Находим контейнер канала (фида)
  const channel = doc.querySelector("channel");
  if (!channel) {
    const error = new Error("Invalid RSS structure");
    error.isParserError = true;
    throw error;
  }

  // Ищем заголовки фида СТРОГО внутри тега channel через пробел (любая вложенность)
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

  // Собираем посты
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
