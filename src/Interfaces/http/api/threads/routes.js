const routes = (handler) => [
  {
    method: "POST",
    path: "/threads",
    handler: handler.postThreadHandler,
    options: {
      auth: "forumapi_jwt", // Memerlukan autentikasi JWT
    },
  },
  {
    method: "GET",
    path: "/threads/{threadId}",
    handler: handler.getThreadDetailHandler,
    options: {
      auth: false, // Tidak memerlukan autentikasi
    },
  },
];

module.exports = routes;
