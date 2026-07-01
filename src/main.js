import { proxy } from "valtio/vanilla";
import * as yup from "yup";
import i18next from "i18next";
import watch from "./view.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

// 1. Конфигурация словаря i18next
const resources = {
  ru: {
    translation: {
      errors: {
        required: "Не должно быть пустым",
        url: "Ссылка должна быть валидным URL",
        notOneOf: "RSS уже существует",
      },
      success: "RSS успешно добавлен",
    },
  },
};

// 2. Связываем Yup с i18next (Yup возвращает ключи вместо текста)
yup.setLocale({
  string: {
    url: "errors.url",
  },
  mixed: {
    required: "errors.required",
    notOneOf: "errors.notOneOf",
  },
});

const state = proxy({
  form: {
    status: "filling",
    error: null, // Здесь теперь будет храниться КЛЮЧ ошибки (строка)
  },
  feeds: [],
});

const validateUrl = (url, feeds) => {
  const schema = yup.string().required().url().notOneOf(feeds);

  return schema.validate(url);
};

const app = () => {
  // Создаем инстанс i18next
  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: "ru",
      debug: false,
      resources,
    })
    .then(() => {
      const elements = {
        form: document.querySelector(".rss-form"),
        input: document.querySelector("#url-input"),
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

      // Передаем инстанс i18next в вотчер
      watch(elements, state, i18nInstance);

      elements.form.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const url = formData.get("url").trim();

        validateUrl(url, state.feeds)
          .then((validUrl) => {
            state.feeds.push(validUrl);
            state.form.error = null;
            state.form.status = "valid";
            state.form.status = "filling";
          })
          .catch((error) => {
            // Записываем ключ ошибки (например, 'errors.url') в стейт
            state.form.error = error.message;
            state.form.status = "invalid";
          });
      });
    });
};

app();
