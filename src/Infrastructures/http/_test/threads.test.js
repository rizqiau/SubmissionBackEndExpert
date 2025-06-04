const pool = require("../../database/postgres/pool");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper"); // Import ThreadsTableTestHelper
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper"); // <<< PASTIKAN BARIS INI ADA
console.log("CommentsTableTestHelper after import:", CommentsTableTestHelper); // <<< TAMBAH BARIS INI
const container = require("../../container");
const createServer = require("../createServer");
const Jwt = require("@hapi/jwt"); // Import Jwt
const AuthenticationTokenManager = require("../../../Applications/security/AuthenticationTokenManager"); // Import AuthenticationTokenManager
const JwtTokenManager = require("../../security/JwtTokenManager"); // Import JwtTokenManager
const bcrypt = require("bcrypt"); // <<< TAMBAH BARIS INI UNTUK BCrypt

describe("/threads endpoint", () => {
  let server;
  let accessToken;
  let userId;

  beforeAll(async () => {
    server = await createServer(container);

    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    console.log("Database tables cleaned in beforeAll.");

    // Register a dummy user
    userId = "user-test-threads";
    const hashedPassword = await bcrypt.hash("secret", 10); // <<< TAMBAH DAN UBAH BARIS INI
    await UsersTableTestHelper.addUser({
      id: userId,
      username: "threaduser",
      password: hashedPassword, // <<< GUNAKAN HASHED PASSWORD
      fullname: "Thread User", // Tambahkan fullname karena required
    });
    console.log('User "threaduser" added in beforeAll. ID:', userId); // DEBUG LOG

    const userExistsAfterAdd = await UsersTableTestHelper.findUsersById(userId); // <<< CEK KEMBALI
    console.log(
      'User "threaduser" exists after adding (beforeAll):',
      userExistsAfterAdd.length > 0
    ); // DEBUG LOG

    // Login the user to get an access token
    const loginResponse = await server.inject({
      method: "POST",
      url: "/authentications",
      payload: {
        username: "threaduser",
        password: "secret", // Default password from UsersTableTestHelper
      },
    });
    console.log("Login Response Status Code:", loginResponse.statusCode);
    console.log("Login Response Payload:", loginResponse.payload);

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
      }; // body is missing

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
        title: 123, // wrong data type
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
        // No Authorization header
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.message).toEqual("Missing authentication"); // Hapi's default message for missing auth
    });
  });

  describe("when GET /threads/{threadId}", () => {
    it("should response 200 and thread detail", async () => {
      // Arrange
      const threadId = "thread-detail-test";
      const userIdComment = "user-commenter";
      const threadOwnerId = userId; // thread owner is the same as accessToken user
      const dateThread = new Date("2021-08-08T07:00:00.000Z").toISOString();
      const dateComment1 = new Date("2021-08-08T07:05:00.000Z").toISOString();
      const dateComment2 = new Date("2021-08-08T07:10:00.000Z").toISOString();

      const threadOwnerExistsCheck = await UsersTableTestHelper.findUsersById(
        threadOwnerId
      );
      console.log(
        'User "threaduser" exists before addThread (GET test):',
        threadOwnerExistsCheck.length > 0
      );

      await UsersTableTestHelper.addUser({
        id: userIdComment,
        username: "commenter",
        fullname: "Commenter User",
      }); // Add a commenter user
      console.log('User "commenter" added for GET test.'); // DEBUG LOG

      const threadOwnerExistsCheckAfterCommenter =
        await UsersTableTestHelper.findUsersById(threadOwnerId);
      console.log(
        'User "threaduser" exists after adding commenter (GET test):',
        threadOwnerExistsCheckAfterCommenter.length > 0
      );

      await ThreadsTableTestHelper.addThread({
        id: threadId,
        owner: threadOwnerId,
        title: "Thread Test Detail",
        body: "Body Thread Test Detail",
        date: dateThread,
      });

      console.log(
        "CommentsTableTestHelper before addComment:",
        CommentsTableTestHelper
      ); // <<< TAMBAH BARIS INI

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
      console.log(
        "GET /threads/{threadId} Response Status:",
        response.statusCode
      );
      console.log(
        "GET /threads/{threadId} Response Payload:",
        response.payload
      );
      if (response.statusCode === 400) {
        console.error("Specific 400 error message:", responseJson.message); // <<< BARIS PENTING INI
      }
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.id).toEqual(threadId);
      expect(responseJson.data.thread.title).toEqual("Thread Test Detail");
      expect(responseJson.data.thread.body).toEqual("Body Thread Test Detail");
      expect(new Date(responseJson.data.thread.date).toISOString()).toEqual(
        dateThread
      ); // Pastikan tanggal konsisten UTC
      expect(responseJson.data.thread.username).toEqual("threaduser"); // Username dari owner thread

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
      ); // Perhatikan ini
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
