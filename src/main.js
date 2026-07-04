import { proxy } from "valtio/vanilla";
import * as yup from "yup";
import i18next from "i18next";
import axios from "axios";
import watch from "./view.js";
import parseRss from "./parser.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

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
      success: "RSS успешно добавлен",
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
});

const addedUrls = [];

const validateUrl = (url, urls) => {
  const schema = yup.string().required().url().notOneOf(urls);
  return schema.validate(url);
};

const buildProxyUrl = (url) => {
  return `https://corsproxy.io?url=${encodeURIComponent(url)}`;
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
      };

      let feedbackEl = document.querySelector(".feedback");
      if (!feedbackEl) {
        feedbackEl = document.createElement("div");
        feedbackEl.className = "feedback invalid-feedback";
        elements.input.parentNode.appendChild(feedbackEl);
        elements.feedback = feedbackEl;
      } else {
        elements.feedback = feedbackEl;
      }

      watch(elements, state, i18nInstance);

      elements.form.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const url = formData.get("url").trim();

        state.form.status = "loading";

        validateUrl(url, addedUrls)
          .then((validUrl) => {
            return axios
              .get(buildProxyUrl(validUrl))
              .then((response) => ({ response, validUrl }));
          })
          .then(({ response, validUrl }) => {
            const rawContent = response.data;

            if (!rawContent) {
              throw new Error("Empty response from proxy");
            }

            const { feed, posts } = parseRss(rawContent);

            const feedId = crypto.randomUUID();

            state.feeds.push({ ...feed, id: feedId, url: validUrl });
            addedUrls.push(validUrl);

            posts.forEach((post) => {
              state.posts.push({ ...post, id: crypto.randomUUID(), feedId });
            });

            state.form.error = null;
            state.form.status = "valid";
            state.form.status = "filling";
          })
          .catch((error) => {
            console.error("Catch block caught error:", error);
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
