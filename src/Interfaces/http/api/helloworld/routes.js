const routes = (handler) => [
  {
    method: "GET",
    path: "/hello-world",
    handler: handler.getHelloWorldHandler,
    options: {
      auth: false, // Tidak memerlukan autentikasi
    },
  },
];

module.exports = routes;
