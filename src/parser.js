export default (xmlString) => {
  const parser = new DOMParser();
  // Передаем text/xml вместо application/xml для максимальной устойчивости к разметке
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("DOMParser error details:", parseError.textContent);
    const error = new Error("Invalid RSS");
    error.isParserError = true;
    throw error;
  }

  // ИСПРАВЛЕНИЕ: Убираем жесткую вложенность '>' и ищем теги просто по всему документу
  const feedTitleEl = doc.querySelector("title");
  const feedDescriptionEl = doc.querySelector("description");

  // Проверяем, является ли документ валидным RSS (в нем обязательно должен быть тег <rss> или <channel>)
  const isRss = doc.querySelector("rss") || doc.querySelector("channel");

  if (!isRss || !feedTitleEl) {
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
