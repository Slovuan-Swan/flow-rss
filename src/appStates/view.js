import onChange from "on-change";

const setAttributes = (el, attrs) => {
  Object.keys(attrs).forEach((attr) => {
    el.setAttribute(attr, attrs[attr]);
  });
};

const updateStaticElements = (i18n, items) => {
  const names = Object.keys(items);
  names.forEach((itemName) => {
    items[itemName].textContent = i18n.t(`staticAppItems.${itemName}`);
  });
};

const getClassNameForLangButton = (currentLang, lang) =>
  currentLang === lang ? "btn btn-primary active" : "btn btn-outline-primary";

const updateLangButtons = (items, currentLang) => {
  const { englishButton, russianButton } = items;
  englishButton.className = getClassNameForLangButton(currentLang, "en");
  russianButton.className = getClassNameForLangButton(currentLang, "ru");
};

const updateFeedback = (i18n, elements, path) => {
  const { feedbackElement } = elements;
  feedbackElement.textContent = i18n.t(path);
};

const updateVisitedPosts = (watchedState) => {
  const { visitedPosts } = watchedState.uiState;
  visitedPosts.forEach((postId) => {
    const visitedPost = document.querySelector(`a[data-id="${postId}"]`);
    visitedPost.classList.remove("fw-bold");
    visitedPost.classList.add("fw-normal", "text-secondary");
  });
};

const updateModal = (watchedState, elements, currentId) => {
  const [currentPost] = watchedState.data.posts.filter(
    ({ id }) => Number(id) === currentId,
  );
  if (!currentPost) return;
  const modalTitle = document.querySelector(".modal-header > h5");
  modalTitle.textContent = currentPost.title;
  const modalBody = document.querySelector(".modal-body");
  modalBody.innerHTML = "";
  const modalDescription = document.createElement("p");
  modalDescription.textContent = currentPost.description;
  modalBody.append(modalDescription);
  const { modalLink } = elements.staticElements;
  modalLink.href = currentPost.link;
};

const renderFeeds = (i18n, elements, feeds) => {
  const { feedsElement } = elements;
  feedsElement.innerHTML = "";
  const feedsContainer = document.createElement("div");
  feedsContainer.classList.add("card", "border-0");

  const feedsBody = document.createElement("div");
  feedsBody.classList.add("card-body", "text-center");
  const feedsTitle = document.createElement("h2");
  feedsTitle.classList.add("card-title", "h3");
  feedsTitle.textContent = i18n.t("fields.feeds.title");
  feedsBody.append(feedsTitle);

  const feedsList = document.createElement("ul");
  feedsList.classList.add("list-group", "rounded-0");
  feeds.forEach((feed) => {
    const { title, description } = feed;
    const feedItem = document.createElement("li");
    feedItem.classList.add("list-group-item", "border-0");
    const feedTitle = document.createElement("h3");
    feedTitle.classList.add("h6", "mb-0");
    feedTitle.textContent = title;
    const feedDescription = document.createElement("p");
    feedDescription.classList.add("mb-0", "text-black-50", "small");
    feedDescription.textContent = description;
    feedItem.append(feedTitle, feedDescription);
    feedsList.prepend(feedItem);
  });
  feedsContainer.append(feedsBody, feedsList);
  feedsElement.append(feedsContainer);
};

const renderPosts = (watchedState, i18n, elements, posts) => {
  const { postsElement } = elements;
  postsElement.innerHTML = "";
  const postsContainer = document.createElement("div");
  postsContainer.classList.add("card", "border-0");

  const postsBody = document.createElement("div");
  postsBody.classList.add("card-body", "text-center");
  const postsTitle = document.createElement("h2");
  postsTitle.classList.add("card-title", "h3");
  postsTitle.textContent = i18n.t("fields.posts.title");
  postsBody.append(postsTitle);

  const postsList = document.createElement("ul");
  postsList.classList.add("list-group", "rounded-0");
  posts.forEach((post) => {
    const { id, title, link } = post;
    const postItem = document.createElement("li");
    postItem.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "gap-2",
      "border-0",
    );
    const postLink = document.createElement("a");
    setAttributes(postLink, {
      href: `${link}`,
      class: "fw-bold",
      target: "_blank",
      rel: "noopener noreferrer",
      "data-id": `${id}`,
    });
    postLink.textContent = title;
    const postButton = document.createElement("button");
    setAttributes(postButton, {
      type: "button",
      class: "btn btn-outline-primary fw-semibold",
      "data-id": `${id}`,
      "data-bs-toggle": "modal",
      "data-bs-target": "#modal",
    });
    postButton.textContent = i18n.t("fields.posts.button");

    postItem.append(postLink, postButton);
    postsList.append(postItem);
  });
  postsList.addEventListener("click", (event) => {
    const element = event.target;
    if (element.tagName !== "A") return;
    const id = element.dataset.id;
    watchedState.uiState.visitedPosts.push(Number(id));
  });
  postsContainer.append(postsBody, postsList);
  postsElement.append(postsContainer);
  updateVisitedPosts(watchedState);
};

const handleFailState = (elements) => {
  const { inputElement, feedbackElement } = elements;
  inputElement.classList.add("is-invalid");
  feedbackElement.classList.add("text-danger");
  feedbackElement.classList.remove("text-success");
};

const handleSuccessState = (elements) => {
  const { inputElement, feedbackElement } = elements;
  inputElement.classList.remove("is-invalid");
  feedbackElement.classList.remove("text-danger");
  feedbackElement.classList.add("text-success");
};

const handleProcessStatus = (i18n, elements, value) => {
  const { staticElements, formElement, inputElement } = elements;
  const { submitButton } = staticElements;
  switch (value) {
    case "default":
      updateStaticElements(i18n, staticElements);
      break;
    case "sending":
      submitButton.disabled = true;
      break;
    case "fail":
      submitButton.disabled = false;
      handleFailState(elements);
      break;
    case "success":
      submitButton.disabled = false;
      formElement.reset();
      inputElement.focus();
      handleSuccessState(elements);
      break;
    default:
      break;
  }
};

export default (state, i18n, elements) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case "processStatus":
        handleProcessStatus(i18n, elements, value);
        break;
      case "data.feeds":
        renderFeeds(i18n, elements, value);
        break;
      case "data.posts":
        renderPosts(watchedState, i18n, elements, value);
        break;
      case "uiState.feedback":
        updateFeedback(i18n, elements, value);
        break;
      case "uiState.visitedPosts":
        updateVisitedPosts(watchedState);
        break;
      case "uiState.activePost":
        updateModal(watchedState, elements, value);
        break;
      case "currentLang":
        updateStaticElements(i18n, elements.staticElements);
        updateLangButtons(elements.staticElements, value);
        if (watchedState.data.feeds.length > 0) {
          renderFeeds(i18n, elements, watchedState.data.feeds);
        }
        if (watchedState.data.posts.length > 0) {
          renderPosts(watchedState, i18n, elements, watchedState.data.posts);
        }
        if (watchedState.uiState.feedback) {
          updateFeedback(i18n, elements, watchedState.uiState.feedback);
        }
        break;
      default:
        break;
    }
  });
  return watchedState;
};
