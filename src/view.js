import { subscribe } from "valtio/vanilla";

const buildCard = (titleText) => {
  const card = document.createElement("div");
  card.className = "card border-0";

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement("h2");
  title.className = "card-title h4";
  title.textContent = titleText;

  cardBody.appendChild(title);
  card.appendChild(cardBody);

  const ul = document.createElement("ul");
  ul.className = "list-group border-0 rounded-0";
  card.appendChild(ul);

  return { card, ul };
};

const renderFeeds = (container, feeds, i18n) => {
  if (!container) return;
  container.innerHTML = "";
  if (feeds.length === 0) return;

  const { card, ul } = buildCard(i18n.t("interface.feeds"));

  feeds.forEach((feed) => {
    const li = document.createElement("li");
    li.className = "list-group-item border-0 border-end-0";

    const h3 = document.createElement("h3");
    h3.className = "h6 m-0";
    h3.textContent = feed.title;

    const p = document.createElement("p");
    p.className = "m-0 small text-black-50";
    p.textContent = feed.description;

    li.append(h3, p);
    ul.appendChild(li);
  });

  container.appendChild(card);
};

const renderPosts = (container, posts, readPostIds, i18n) => {
  if (!container) return;
  container.innerHTML = "";
  if (posts.length === 0) return;

  const { card, ul } = buildCard(i18n.t("interface.posts"));

  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-start border-0 border-end-0";

    const a = document.createElement("a");
    a.setAttribute("href", post.link);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    a.setAttribute("data-id", post.id);

    const isRead = readPostIds.includes(post.id);
    a.className = isRead ? "fw-normal text-secondary" : "fw-bold";
    a.textContent = post.title;

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.className = "btn btn-outline-primary btn-sm";
    button.setAttribute("data-id", post.id);
    button.setAttribute("data-bs-toggle", "modal");
    button.setAttribute("data-bs-target", "#modal");
    button.textContent = "Просмотр";

    li.appendChild(a);
    li.appendChild(button);
    ul.appendChild(li);
  });

  container.appendChild(card);
};

const renderModal = (postId, posts) => {
  if (!postId) return;
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  const modalTitle = document.querySelector(".modal-title");
  const modalBody = document.querySelector(".modal-body");
  const modalFullLink = document.querySelector(".modal-footer .full-link");

  modalTitle.textContent = post.title;
  modalBody.textContent = post.description;
  modalFullLink.setAttribute("href", post.link);
};

// Функция управления состоянием кнопок и полей ввода
const handleFormState = (elements, status) => {
  const { input, form } = elements;
  const submitButton = form.querySelector('button[type="submit"]');

  if (status === "loading") {
    input.setAttribute("disabled", "true");
    submitButton.setAttribute("disabled", "true");
  } else {
    input.removeAttribute("disabled");
    submitButton.removeAttribute("disabled");
  }
};

export default (elements, state, i18n) => {
  const { input, form, feedback, feedsContainer, postsContainer } = elements;

  subscribe(state, () => {
    // 1. Управляем доступностью интерфейса на основе статуса формы
    handleFormState(elements, state.form.status);

    // 2. Обработка конкретных состояний формы
    if (state.form.status === "filling") {
      input.classList.remove("is-invalid");
      feedback.classList.remove("text-danger", "text-success");
      feedback.textContent = "";
    }

    if (state.form.status === "invalid") {
      input.classList.add("is-invalid");
      feedback.classList.remove("text-success");
      feedback.classList.add("text-danger");
      feedback.textContent = i18n.t(state.form.error);
    }

    if (state.form.status === "valid") {
      input.classList.remove("is-invalid");
      feedback.classList.remove("text-danger");
      feedback.classList.add("text-success");
      feedback.textContent = i18n.t("success");
      form.reset();
      input.focus();
    }

    // 3. Синхронизируем UI со списками данных
    renderFeeds(feedsContainer, state.feeds, i18n);
    renderPosts(postsContainer, state.posts, state.uiState.readPostIds, i18n);
    renderModal(state.uiState.displayedPostId, state.posts);
  });
};
