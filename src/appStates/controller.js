import * as yup from "yup";
import axios from "axios";
import uniqueId from "lodash.uniqueid";
import "bootstrap/js/dist/modal";

const feedbackInners = {
  required: "feedback.validation.required",
  duplicated: "feedback.validation.duplicated",
  incorrectUrl: "feedback.validation.incorrectUrl",
  fail: "feedback.processStates.fail",
  success: "feedback.processStates.success",
  network: "feedback.network",
};

yup.setLocale({
  mixed: {
    required: () => feedbackInners.required,
    notOneOf: () => feedbackInners.duplicated,
  },
  string: {
    url: () => feedbackInners.incorrectUrl,
  },
});

const initSchema = (urls) =>
  yup.object().shape({
    url: yup.string().required().url().notOneOf(urls),
  });

const routes = (url) =>
  `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;

const changeLanguage = (watchedState, i18n, lang) => {
  i18n.changeLanguage(lang).then(() => {
    watchedState.currentLang = lang;
  });
};

const parseXMLStringToDoc = (str) =>
  new DOMParser().parseFromString(str, "application/xml");

const validateRssFormat = (str) => {
  const doc = parseXMLStringToDoc(str);
  const isErrorFormat = doc.querySelector("parsererror");
  const isRSSFormat = doc.querySelector("rss");
  if (isErrorFormat && !isRSSFormat) throw new Error(feedbackInners.fail);
};

const parseFeedAndPosts = (str) => {
  const doc = parseXMLStringToDoc(str);

  const feedId = uniqueId();
  const data = {
    feed: {
      id: feedId,
      title: doc.querySelector("title").textContent,
      description: doc.querySelector("description").textContent,
    },
    posts: [],
  };

  const posts = doc.querySelectorAll("item");
  data.posts = [...posts].map((post) => ({
    id: uniqueId(),
    feedId,
    title: post.querySelector("title").textContent,
    description: post.querySelector("description").textContent,
    link: post.querySelector("link").textContent,
  }));
  return data;
};

const requestRss = (rssLink) =>
  axios
    .get(rssLink)
    .then((response) => parseFeedAndPosts(response.data.contents))
    .catch((error) => {
      console.error(error.message);
      return null;
    });

const mergePosts = (watchedState, objects, links) => {
  const correctObjects = objects.filter(Boolean);
  correctObjects.forEach((obj) => {
    const newPosts = obj.posts.filter(({ link }) => !links.includes(link));
    watchedState.data.posts = [...newPosts, ...watchedState.data.posts];
  });
};

const updatePosts = (watchedState) => {
  const links = watchedState.data.posts.map(({ link }) => link);
  const rssLinks = watchedState.form.urls.map((url) => routes(url));

  setTimeout(() => {
    const promises = rssLinks.map(requestRss);
    Promise.all(promises)
      .then((objects) => mergePosts(watchedState, objects, links))
      .catch((error) => console.error(error.message))
      .finally(() => updatePosts(watchedState));
  }, 5000);
};

export default (watchedState, i18n, elements) => {
  const { formElement, modalElement, staticElements } = elements;
  const { englishButton, russianButton } = staticElements;
  watchedState.processStatus = "default";

  englishButton.addEventListener("click", () => {
    changeLanguage(watchedState, i18n, "en");
  });

  russianButton.addEventListener("click", () => {
    changeLanguage(watchedState, i18n, "ru");
  });

  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    const { urls } = watchedState.form;
    const formData = new FormData(formElement);
    const newUrl = { url: formData.get("url").trim() };

    const schema = initSchema(urls);
    schema
      .validate(newUrl)
      .then(() => {
        const rightUrl = routes(newUrl.url);
        watchedState.processStatus = "sending";
        return axios.get(rightUrl);
      })
      .then((response) => {
        const xmlString = response.data.contents;
        validateRssFormat(xmlString);
        watchedState.uiState.feedback = feedbackInners.success;
        watchedState.processStatus = "success";
        urls.push(newUrl.url);

        const obj = parseFeedAndPosts(xmlString);
        watchedState.data.feeds.push(obj.feed);
        watchedState.data.posts = [...obj.posts, ...watchedState.data.posts];

        if (urls.length === 1) updatePosts(watchedState);
      })
      .catch((error) => {
        watchedState.uiState.feedback =
          error.code === "ERR_NETWORK" ? feedbackInners.network : error.message;
        watchedState.processStatus = "fail";
      });
  });

  if (modalElement) {
    modalElement.addEventListener("show.bs.modal", (event) => {
      const { visitedPosts } = watchedState.uiState;
      const button = event.relatedTarget;
      const currentId = Number(button.dataset.id);
      watchedState.uiState.activePost = currentId;

      if (visitedPosts.includes(currentId)) return;
      visitedPosts.push(currentId);
    });
  }
};
