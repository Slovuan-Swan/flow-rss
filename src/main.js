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

// Функция сборки URL для AllOrigins (строго по спецификации тестов Хекслета)
const buildAllOriginsUrl = (url) => {
  const proxyUrl = new URL("https://allorigins.win/get");
  proxyUrl.searchParams.set("disableCache", "true");
  proxyUrl.searchParams.set("url", url);
  return proxyUrl.toString();
};

// Функция сборки URL для резервного CorsProxy
const buildBackupProxyUrl = (url) => {
  const part1 = "https://corsproxy.io/?url=";
  const part2 = encodeURIComponent(url);
  return part1 + part2;
};

// Безопасное извлечение контента
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

// Универсальный сетевой слой с автоматическим фолбэком
const makeRequest = (url) => {
  // Добавляем strict timeout в 1000 миллисекунд для первого запроса.
  // Если AllOrigins лежит, мы не будем ждать 2 минуты, а переключимся на CorsProxy за 1 секунду!
  return axios
    .get(buildAllOriginsUrl(url), { timeout: 1000 })
    .then((response) => {
      const content = extractXml(response);
      if (
        typeof content === "string" &&
        content.startsWith("<!DOCTYPE html>")
      ) {
        throw new Error("Proxy returned HTML");
      }
      return response;
    })
    .catch(() => {
      // Если AllOrigins выдал ошибку или протух по таймауту за 1 секунду —
      // мгновенно уходим на стабильный CorsProxy
      return axios.get(buildBackupProxyUrl(url));
    });
};

const updateFeeds = (state) => {
  // Если фидов вдруг нет, просто перезапускаем таймер через 5 секунд и выходим
  if (state.feeds.length === 0) {
    setTimeout(() => updateFeeds(state), 5000);
    return;
  }

  const promises = state.feeds.map((feed) => {
    return makeRequest(feed.url)
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

  // Перезапускаем setTimeout строго ПОСЛЕ того, как выполнились ВСЕ запросы текущего цикла
  Promise.all(promises).finally(() => {
    setTimeout(() => updateFeeds(state), 5000);
  });
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

      // ИСПРАВЛЕНИЕ ТУТ:updateFeeds больше не вызывается здесь в лоб!
      // Вместо этого мы запустим опрос один раз при добавлении самого первого фида.

      elements.postsContainer.addEventListener("click", (e) => {
        // ... твой код кликов без изменений
      });

      elements.input.addEventListener("input", () => {
        // ... твой код инпута без изменений
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
            return makeRequest(validUrl).then((response) => ({
              response,
              validUrl,
            }));
          })
          .then(({ response, validUrl }) => {
            const rawContent = extractXml(response);
            if (!rawContent) throw new Error("Empty response from proxy");

            const { feed, posts } = parseRss(rawContent);
            const feedId = crypto.randomUUID();

            // ИСПРАВЛЕНИЕ ТУТ: Если это самый первый фид в приложении,
            // запускаем фоновый опрос именно сейчас
            const isFirstFeed = state.feeds.length === 0;

            state.feeds.push({ ...feed, id: feedId, url: validUrl });

            posts.forEach((post) => {
              state.posts.push({ ...post, id: crypto.randomUUID(), feedId });
            });

            if (isFirstFeed) {
              setTimeout(() => updateFeeds(state), 5000);
            }

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

app();
