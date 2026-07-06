export default () => {
  return {
    form: {
      urls: [],
    },
    data: {
      feeds: [],
      posts: [],
    },
    uiState: {
      visitedPosts: [],
      activePost: null,
      feedback: null,
    },
    processStatus: "", // 'default', 'sending', 'fail', 'success'
    currentLang: "ru", // 'ru', 'en'
  };
};
