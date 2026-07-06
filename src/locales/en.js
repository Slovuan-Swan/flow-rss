export default {
  translation: {
    staticAppItems: {
      title: "RSS aggregator",
      description: "Start reading RSS today! It's easy, and it's great.",
      label: "RSS link",
      submitButton: "Add",
      example: "Example: https://lorem-rss.hexlet.app/feed",
      modalLink: "Read more",
      modalClose: "Close",
      englishButton: "En",
      russianButton: "Ru",
    },
    fields: {
      feeds: {
        title: "Feeds",
      },
      posts: {
        title: "Posts",
        button: "View",
      },
    },
    feedback: {
      validation: {
        required: "It shouldn't be empty",
        duplicated: "RSS already exists",
        incorrectUrl: "The link must be a valid URL",
      },
      processStates: {
        success: "RSS loaded successfully",
        fail: "This site does not contain a valid RSS feed",
      },
      network: "Network Error",
    },
  },
};
