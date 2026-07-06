import { proxy } from "valtio/vanilla";
import * as yup from "yup";
import i18n from "i18next";
import axios from "axios";
import watch from "./view.js";
import parseRss from "./parser.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import "bootstrap";

const resources = {
  ru: {
    translation: {
      feedback: {
        success: "RSS успешно загружен",
        required: "Не должно быть пустым",
        url: "Ссылка должна быть валидным URL",
        notOneOf: "RSS уже существует",
        network: "Ошибка сети",
        invalidRss: "Ресурс не содержит валидный RSS",
      },
      interface: {
        feeds: "Фиды",
        posts: "Посты",
      },
    },
  },
};

yup.setLocale({
  string: { url: "feedback.url" },
  mixed: { required: "feedback.required", notOneOf: "feedback.notOneOf" },
});

const state = proxy({
  form: {
    status: "filling",
    error: null,
  },
  feeds: [],
  posts: [],
  uiState: {
    displayedPostId: null,
    readPostIds: [],
  },
});

const validateUrl = (url, urls) => {
  const schema = yup.string().required().url().notOneOf(urls);
  return schema.validate(url);
};

const buildProxyUrl = (url) => {
  const proxyUrl = new URL("https://allorigins.win");
  proxyUrl.pathname = "/get";
  proxyUrl.searchParams.set("disableCache", "true");
  proxyUrl.searchParams.set("url", url);
  return proxyUrl.toString();
};

const extractXml = (response) => {
  return response.data.contents;
};

const app = () => {
  const elements = {
    form: document.querySelector(".rss-form"),
    input: document.querySelector("#url-input"),
    feedsContainer: document.querySelector(".feeds"),
    postsContainer: document.querySelector(".posts"),
    feedback: document.querySelector(".feedback"),
  };

  return i18n
    .init({
      lng: "ru",
      resources,
    })
    .then(() => {
      watch(elements, state, i18n);
      updateFeeds(state);

      elements.postsContainer.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        if (!id) return;
        if (!state.uiState.readPostIds.includes(id)) {
          state.uiState.readPostIds.push(id);
        }
        if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
          state.uiState.displayedPostId = id;
        }
      });

      elements.input.addEventListener("input", () => {
        state.form.status = "filling";
        state.form.error = null;
      });

      elements.form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (state.form.status === "loading") return;

        const formData = new FormData(e.target);
        const url = formData.get("url").trim();

        state.form.status = "loading";
        const addedUrls = state.feeds.map((feed) => feed.url);

        validateUrl(url, addedUrls)
          .then((validUrl) => {
            return axios
              .get(buildProxyUrl(validUrl))
              .then((response) => ({ response, validUrl }));
          })
          .then(({ response, validUrl }) => {
            const rawContent = extractXml(response);
            if (!rawContent) throw new Error("Empty response from proxy");

            const { feed, posts } = parseRss(rawContent);
            const feedId = crypto.randomUUID();

            state.form.error = null;
            state.form.status = "valid";

            state.feeds.push({ ...feed, id: feedId, url: validUrl });

            const postsWithIds = posts.map((post) => ({
              ...post,
              id: crypto.randomUUID(),
              feedId,
            }));
            state.posts.push(...postsWithIds);
          })
          .catch((error) => {
            if (error.isParserError) {
              state.form.error = "feedback.invalidRss";
            } else if (axios.isAxiosError(error)) {
              state.form.error = "feedback.network";
            } else {
              state.form.error = error.message;
            }
            state.form.status = "invalid";
          });
      });
    });
};

const updateFeeds = (state) => {
  const promises = state.feeds.map((feed) => {
    return axios
      .get(buildProxyUrl(feed.url))
      .then((response) => {
        const rawContent = extractXml(response);
        if (!rawContent) return;

        const { posts } = parseRss(rawContent);
        const currentLinks = state.posts
          .filter((p) => p.feedId === feed.id)
          .map((p) => p.link);
        const newPosts = posts.filter(
          (post) => !currentLinks.includes(post.link),
        );

        if (newPosts.length > 0) {
          const postsWithIds = newPosts.map((post) => ({
            ...post,
            id: crypto.randomUUID(),
            feedId: feed.id,
          }));
          state.posts.unshift(...postsWithIds);
        }
      })
      .catch((err) => {
        console.error("Error during auto-update feed:", feed.url, err);
      });
  });

  Promise.all(promises).finally(() => {
    setTimeout(() => updateFeeds(state), 5000);
  });
};

export default app;
