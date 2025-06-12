const pool = require("../../database/postgres/pool");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const container = require("../../container");
const createServer = require("../createServer");
const bcrypt = require("bcrypt");

describe("/threads/{threadId}/comments endpoint", () => {
  let server;
  let accessToken;
  let userId;
  let threadId;

  beforeAll(async () => {
    server = await createServer(container);

    userId = "user-test-comments-e2e";
    const hashedPassword = await bcrypt.hash("secret", 10);
    await UsersTableTestHelper.addUser({
      id: userId,
      username: "commentuser_e2e",
      password: hashedPassword,
      fullname: "Comment User E2E",
    });

    const loginResponse = await server.inject({
      method: "POST",
      url: "/authentications",
      payload: {
        username: "commentuser_e2e",
        password: "secret",
      },
    });
    const responseJson = JSON.parse(loginResponse.payload);
    accessToken = responseJson.data.accessToken;

    threadId = "thread-test-comments-e2e";
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("when POST /threads/{threadId}/comments", () => {
    it("should response 201 and persisted comment", async () => {
      // Arrange
      const requestPayload = {
        content: "a comment content",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment.content).toEqual(
        requestPayload.content
      );
      expect(responseJson.data.addedComment.owner).toEqual(userId);

      const comments = await CommentsTableTestHelper.findCommentById(
        responseJson.data.addedComment.id
      );
      expect(comments).toHaveLength(1);
    });

    it("should response 400 when request payload not contain needed property", async () => {
      // Arrange
      const requestPayload = {}; // content is missing

      // Action
      const response = await server.inject({
        method: "POST",
        url: `/threads/${threadId}/comments`,
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
        "tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada"
      );
    });

    it("should response 400 when request payload not meet data type specification", async () => {
      // Arrange
      const requestPayload = {
        content: 123, // wrong data type
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: `/threads/${threadId}/comments`,
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
        "tidak dapat membuat komentar baru karena tipe data tidak sesuai"
      );
    });

    it("should response 401 when request is not authenticated", async () => {
      // Arrange
      const requestPayload = {
        content: "a comment content",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        // No Authorization header
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.message).toEqual("Missing authentication");
    });

    it("should response 404 when thread is not found", async () => {
      // Arrange
      const invalidThreadId = "thread-invalid-id";
      const requestPayload = {
        content: "a comment content",
      };

      // Action
      const response = await server.inject({
        method: "POST",
        url: `/threads/${invalidThreadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual("thread tidak ditemukan");
    });
  });

  describe("when DELETE /threads/{threadId}/comments/{commentId}", () => {
    it("should response 200 and soft delete comment", async () => {
      // Arrange
      const commentId = "comment-test-delete";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "comment to be deleted",
        threadId,
        owner: userId,
      });

      // Action
      const response = await server.inject({
        method: "DELETE",
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");

      const comments = await CommentsTableTestHelper.findCommentById(commentId);
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });

    it("should response 401 when request is not authenticated", async () => {
      // Arrange
      const commentId = "comment-no-auth";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "comment no auth",
        threadId,
        owner: userId,
      });

      // Action
      const response = await server.inject({
        method: "DELETE",
        url: `/threads/${threadId}/comments/${commentId}`,
        // No Authorization header
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.message).toEqual("Missing authentication");
    });

    it("should response 403 when not comment owner", async () => {
      // Arrange
      const commentId = "comment-wrong-owner";
      const wrongOwnerId = "user-wrong-owner";
      const hashedPasswordWrong = await bcrypt.hash("wrongsecret", 10);
      await UsersTableTestHelper.addUser({
        id: wrongOwnerId,
        username: "wronguser",
        password: hashedPasswordWrong,
        fullname: "Wrong User",
      });
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "comment with wrong owner",
        threadId,
        owner: userId,
      });

      const loginWrongResponse = await server.inject({
        method: "POST",
        url: "/authentications",
        payload: {
          username: "wronguser",
          password: "wrongsecret",
        },
      });
      const wrongAccessToken = JSON.parse(loginWrongResponse.payload).data
        .accessToken;

      // Action
      const response = await server.inject({
        method: "DELETE",
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${wrongAccessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual(
        "Anda tidak berhak menghapus komentar ini"
      );
    });

    it("should response 404 when thread is not found", async () => {
      // Arrange
      const invalidThreadId = "thread-delete-invalid";
      const commentId = "comment-delete-invalid";

      // Action
      const response = await server.inject({
        method: "DELETE",
        url: `/threads/${invalidThreadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual("thread tidak ditemukan");
    });

    it("should response 404 when comment is not found", async () => {
      // Arrange
      const invalidCommentId = "comment-delete-notfound";

      // Action
      const response = await server.inject({
        method: "DELETE",
        url: `/threads/${threadId}/comments/${invalidCommentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual("komentar tidak ditemukan");
    });
  });
});
