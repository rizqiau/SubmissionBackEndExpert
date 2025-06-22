class HelloHandler {
  constructor() {
    this.getHelloWorldHandler = this.getHelloWorldHandler.bind(this);
  }

  async getHelloWorldHandler(request, h) {
    const response = h.response({
      status: "success",
      message: "Hello World from API!",
    });
    response.code(200);
    return response;
  }
}

module.exports = HelloHandler;
