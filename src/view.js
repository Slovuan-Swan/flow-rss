import { subscribe } from "valtio/vanilla";

const render = (elements, state, i18n) => {
  const { input, form, feedback } = elements;

  input.classList.remove("is-invalid");
  feedback.classList.remove("text-danger", "text-success");
  feedback.textContent = "";

  if (state.form.status === "invalid") {
    input.classList.add("is-invalid");
    feedback.classList.add("text-danger");
    // Переводим ключ ошибки с помощью i18next
    feedback.textContent = i18n.t(state.form.error);
  }

  if (state.form.status === "valid") {
    form.reset();
    input.focus();
    feedback.classList.add("text-success");
    // Переводим текст успешного добавления
    feedback.textContent = i18n.t("success");
  }
};

export default (elements, state, i18n) => {
  subscribe(state.form, () => {
    render(elements, state, i18n);
  });
};
