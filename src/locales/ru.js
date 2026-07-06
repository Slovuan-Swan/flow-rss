export default {
  translation: {
    staticAppItems: {
      title: "RSS агрегатор",
      description: "Начните читать RSS сегодня! Это легко, это красиво.",
      label: "Ссылка RSS",
      submitButton: "Добавить",
      example: "Пример: https://lorem-rss.hexlet.app/feed",
      modalLink: "Читать полностью",
      modalClose: "Закрыть",
      englishButton: "En",
      russianButton: "Ru",
    },
    fields: {
      feeds: {
        title: "Фиды",
      },
      posts: {
        title: "Посты",
        button: "Просмотр",
      },
    },
    feedback: {
      validation: {
        required: "Не должно быть пустым",
        duplicated: "RSS уже существует",
        incorrectUrl: "Ссылка должна быть валидным URL",
      },
      processStates: {
        success: "RSS успешно загружен",
        fail: "Ресурс не содержит валидный RSS",
      },
      network: "Ошибка сети",
    },
  },
};
