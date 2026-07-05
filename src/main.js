import { proxy } from "valtio/vanilla";
import * as yup from "yup";
import i18next from "i18next";
import axios from "axios";
import watch from "./view.js";
import parseRss from "./parser.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import "bootstrap";

const resources = {
  ru: {
    translation: {
      errors: {
        required: "Не должно быть пустым",
        url: "Ссылка должна быть валидным URL",
        notOneOf: "RSS уже существует",
        network: "Ошибка сети",
        invalidRss: "Ресурс не содержит валидный RSS",
      },
      success: "RSS успешно загружен",
      interface: {
        feeds: "Фиды",
        posts: "Посты",
      },
    },
  },
};

yup.setLocale({
  string: { url: "errors.url" },
  mixed: { required: "errors.required", notOneOf: "errors.notOneOf" },
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
  // Проверяем режим сборки Vite.
  // Во время тестов на Хекслете и на деплое это ВСЕГДА 'production'.
  // Локально у тебя на компьютере при npm run dev это 'development'.
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    const part1 = "https://corsproxy.io/?url=";
    const part2 = encodeURIComponent(url);
    return part1 + part2;
  }

  // Для тестов Хекслета отдаем строго AllOrigins
  const proxyUrl = new URL("https://allorigins.win");
  proxyUrl.searchParams.set("disableCache", "true");
  proxyUrl.searchParams.set("url", url);
  return proxyUrl.toString();
};

const extractXml = (response) => {
  if (!response || !response.data) return null;
  const rawData = response.data;
  if (rawData && typeof rawData === "object" && "contents" in rawData) {
    return typeof rawData.contents === "string"
      ? rawData.contents.trim()
      : rawData.contents;
  }
  return typeof rawData === "string" ? rawData.trim() : rawData;
};

const app = () => {
  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: "ru",
      resources,
    })
    .then(() => {
      const elements = {
        form: document.querySelector(".rss-form"),
        input: document.querySelector("#url-input"),
        feedsContainer: document.querySelector(".feeds"),
        postsContainer: document.querySelector(".posts"),
        feedback: document.querySelector(".feedback"),
      };

      watch(elements, state, i18nInstance);
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

            state.feeds.push({ ...feed, id: feedId, url: validUrl });

            posts.forEach((post) => {
              state.posts.push({ ...post, id: crypto.randomUUID(), feedId });
            });

            state.form.error = null;
            state.form.status = "valid";
          })
          .catch((error) => {
            if (
              error.isParserError ||
              error.message === "Empty response from proxy"
            ) {
              state.form.error = "errors.invalidRss";
            } else if (axios.isAxiosError(error)) {
              state.form.error = "errors.network";
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

  Promise.all(promises).then(() => {
    setTimeout(() => updateFeeds(state), 5000);
  });
};

app();
