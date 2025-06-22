const routes = require("./routes");
const HelloHandler = require("./handler");

module.exports = {
  name: "hello-world",
  register: async (server, { container }) => {
    const helloHandler = new HelloHandler(); // Tidak ada dependensi container untuk contoh ini
    server.route(routes(helloHandler));
  },
};
