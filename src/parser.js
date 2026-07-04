export default (xmlString) => {
  const parser = new DOMParser();
  // Передаем text/xml вместо application/xml, так как он более устойчив к мелким ошибкам разметки
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    // Выводим текст ошибки парсинга в консоль браузера для дебага
    console.error("DOMParser error details:", parseError.textContent);
    console.log("Received raw content was:", xmlString);

    const error = new Error("Invalid RSS");
    error.isParserError = true;
    throw error;
  }

  // Используем опциональную цепочку ?.textContent на случай, если структура тегов минимально отличается
  const feedTitleEl = doc.querySelector("channel > title");
  const feedDescriptionEl = doc.querySelector("channel > description");

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
