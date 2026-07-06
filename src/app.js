import initModel from "./appStates/model.js";
import initView from "./appStates/view.js";
import bindController from "./appStates/controller.js";
import i18next from "i18next";
import resources from "./locales/index.js";

export default () => {
  const elements = {
    formElement: document.querySelector("#rss-form"),
    inputElement: document.querySelector("#url-input"),
    feedbackElement: document.querySelector("#feedback"),
    feedsElement: document.querySelector("#feeds"),
    postsElement: document.querySelector("#posts"),
    modalElement: document.querySelector("#modal"),
    staticElements: {
      title: document.querySelector("#rss-title"),
      description: document.querySelector("#rss-description"),
      example: document.querySelector("#rss-example"),
      submitButton: document.querySelector("#rss-submit"),
      label: document.querySelector('label[for="url-input"]'),
      modalLink: document.querySelector("#modal-link"),
      modalClose: document.querySelector("#modal-close"),
      englishButton: document.querySelector("#en-button"),
      russianButton: document.querySelector("#ru-button"),
    },
  };

  // init app
  const state = initModel();
  const defaultLanguage = state.currentLang;

  const i18n = i18next.createInstance();
  i18n
    .init({
      lng: defaultLanguage,
      resources,
    })
    .then(() => {
      const watchedState = initView(state, i18n, elements);
      bindController(watchedState, i18n, elements);
    })
    .catch((error) => {
      console.error(error);
    });
};
