const pool = require("../../database/postgres/pool");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const container = require("../../container");
const createServer = require("../createServer");
const Jwt = require("@hapi/jwt");
const AuthenticationTokenManager = require("../../../Applications/security/AuthenticationTokenManager");
const JwtTokenManager = require("../../security/JwtTokenManager");
const bcrypt = require("bcrypt");

describe("/threads endpoint", () => {
  let server;
  let accessToken;
  let userId;

  beforeAll(async () => {
    server = await createServer(container);

    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();

    userId = "user-test-threads";
    const hashedPassword = await bcrypt.hash("secret", 10);
    await UsersTableTestHelper.addUser({
      id: userId,
      username: "threaduser",
      password: hashedPassword,
      fullname: "Thread User",
    });
    const loginResponse = await server.inject({
      method: "POST",
      url: "/authentications",
      payload: {
        username: "threaduser",
        password: "secret",
      },
    });

    const responseJson = JSON.parse(loginResponse.payload);
    accessToken = responseJson.data.accessToken;
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("when POST /threads", () => {
    it("should response 201 and persisted thread", async () => {
      // Arrange
      const requestPayload = {
        title: "a thread title",
        body: "a thread body",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread.title).toEqual(requestPayload.title);
      expect(responseJson.data.addedThread.owner).toEqual(userId);
    });

    it("should response 400 when request payload not contain needed property", async () => {
      // Arrange
      const requestPayload = {
        title: "a thread title",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual(
        "tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada"
      );
    });

    it("should response 400 when request payload not meet data type specification", async () => {
      // Arrange
      const requestPayload = {
        title: 123,
        body: "a thread body",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual(
        "tidak dapat membuat thread baru karena tipe data tidak sesuai"
      );
    });

    it("should response 401 when request is not authenticated", async () => {
      // Arrange
      const requestPayload = {
        title: "a thread title",
        body: "a thread body",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.message).toEqual("Missing authentication");
    });
  });

  describe("when GET /threads/{threadId}", () => {
    it("should response 200 and thread detail", async () => {
      // Arrange
      const threadId = "thread-detail-test";
      const userIdComment = "user-commenter";
      const threadOwnerId = userId;
      const dateThread = new Date("2021-08-08T07:00:00.000Z").toISOString();
      const dateComment1 = new Date("2021-08-08T07:05:00.000Z").toISOString();
      const dateComment2 = new Date("2021-08-08T07:10:00.000Z").toISOString();
      await UsersTableTestHelper.addUser({
        id: userIdComment,
        username: "commenter",
        fullname: "Commenter User",
      });

      await ThreadsTableTestHelper.addThread({
        id: threadId,
        owner: threadOwnerId,
        title: "Thread Test Detail",
        body: "Body Thread Test Detail",
        date: dateThread,
      });

      await CommentsTableTestHelper.addComment({
        id: "comment-detail-1",
        threadId,
        owner: userIdComment,
        content: "Komentar Pertama",
        date: dateComment1,
      });
      await CommentsTableTestHelper.addComment({
        id: "comment-detail-2",
        threadId,
        owner: threadOwnerId,
        content: "Komentar Kedua (Dihapus)",
        date: dateComment2,
        isDeleted: true,
      });

      // Action
      const response = await server.inject({
        method: "GET",
        url: `/threads/${threadId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);

      if (response.statusCode === 400) {
        console.error("Specific 400 error message:", responseJson.message);
      }
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.id).toEqual(threadId);
      expect(responseJson.data.thread.title).toEqual("Thread Test Detail");
      expect(responseJson.data.thread.body).toEqual("Body Thread Test Detail");
      expect(new Date(responseJson.data.thread.date).toISOString()).toEqual(
        dateThread
      );
      expect(responseJson.data.thread.username).toEqual("threaduser");

      // Assert comments
      expect(responseJson.data.thread.comments).toHaveLength(2);
      expect(responseJson.data.thread.comments[0].id).toEqual(
        "comment-detail-1"
      );
      expect(responseJson.data.thread.comments[0].username).toEqual(
        "commenter"
      );
      expect(
        new Date(responseJson.data.thread.comments[0].date).toISOString()
      ).toEqual(dateComment1);
      expect(responseJson.data.thread.comments[0].content).toEqual(
        "Komentar Pertama"
      );

      expect(responseJson.data.thread.comments[1].id).toEqual(
        "comment-detail-2"
      );
      expect(responseJson.data.thread.comments[1].username).toEqual(
        "threaduser"
      );
      expect(
        new Date(responseJson.data.thread.comments[1].date).toISOString()
      ).toEqual(dateComment2);
      expect(responseJson.data.thread.comments[1].content).toEqual(
        "**komentar telah dihapus**"
      );
    });

    it("should response 404 when thread is not found", async () => {
      // Arrange
      const invalidThreadId = "thread-not-found";

      // Action
      const response = await server.inject({
        method: "GET",
        url: `/threads/${invalidThreadId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual("thread tidak ditemukan");
    });
  });
});
