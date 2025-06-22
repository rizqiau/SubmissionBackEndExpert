const createServer = require("../createServer");
const container = require("../../container");

describe("/hello-world endpoint (failure scenario)", () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should deliberately fail to demonstrate CI failure", async () => {
    // Arrange
    // No request payload needed

    // Action
    const response = await server.inject({
      method: "GET",
      url: "/hello-world",
    });

    // Assert (sengaja dibuat gagal)
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(200); // Ini akan berhasil
    expect(responseJson.message).toEqual("This message will cause a failure!"); // Ini akan gagal
  });
});
