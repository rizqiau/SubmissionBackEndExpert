const createServer = require("../createServer");
const container = require("../../container"); // Jika handler memiliki dependensi container

describe("/hello-world endpoint", () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
  });

  afterAll(async () => {
    await server.stop(); // Pastikan server berhenti setelah semua tes
  });

  it("should response 200 and say hello world", async () => {
    // Arrange
    // No request payload needed

    // Action
    const response = await server.inject({
      method: "GET",
      url: "/hello-world",
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(200);
    expect(responseJson.status).toEqual("success");
    expect(responseJson.message).toEqual("Hello World from API!");
  });
});
