const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper"); // Import UserTestHelper
const InvariantError = require("../../../Commons/exceptions/InvariantError");
const NotFoundError = require("../../../Commons/exceptions/NotFoundError"); // Import NotFoundError
const NewThread = require("../../../Domains/threads/entities/NewThread");
const AddedThread = require("../../../Domains/threads/entities/AddedThread");
const pool = require("../../database/postgres/pool");
const ThreadRepositoryPostgres = require("../ThreadRepositoryPostgres");

describe("ThreadRepositoryPostgres", () => {
  beforeAll(async () => {
    // Add a dummy user for thread owner
    await UsersTableTestHelper.addUser({
      id: "user-123",
      username: "dicoding",
    });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable(); // Clean up dummy user
    await pool.end();
  });

  describe("addThread function", () => {
    it("should persist new thread and return added thread correctly", async () => {
      // Arrange
      const newThreadPayload = new NewThread({
        title: "sebuah thread",
        body: "sebuah body thread",
      });
      newThreadPayload.owner = "user-123"; // Set owner ID, should be a registered user

      const fakeIdGenerator = () => "123"; // Stub ID generator
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      await threadRepositoryPostgres.addThread(newThreadPayload);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadById("thread-123");
      expect(threads).toHaveLength(1);
    });

    it("should return AddedThread correctly", async () => {
      // Arrange
      const newThreadPayload = new NewThread({
        title: "sebuah thread",
        body: "sebuah body thread",
      });
      newThreadPayload.owner = "user-123"; // Set owner ID

      const fakeIdGenerator = () => "123"; // Stub ID generator
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(
        newThreadPayload
      );

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: "thread-123",
          title: "sebuah thread",
          owner: "user-123",
        })
      );
    });
  });

  describe("getThreadById function", () => {
    it("should throw NotFoundError when thread not found", async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.getThreadById("thread-invalid")
      ).rejects.toThrowError(NotFoundError);
    });

    it("should return thread detail correctly", async () => {
      // Arrange
      const threadId = "thread-456";
      const userId = "user-123";
      const date = new Date().toISOString();
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        owner: userId,
        date,
      }); // Add thread to DB

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threadDetail = await threadRepositoryPostgres.getThreadById(
        threadId
      );

      // Assert
      expect(threadDetail).toBeDefined();
      expect(threadDetail.id).toEqual(threadId);
      expect(threadDetail.title).toEqual("sebuah thread"); // Default title from helper
      expect(threadDetail.body).toEqual("sebuah body thread"); // Default body from helper
      expect(threadDetail.username).toEqual("dicoding"); // Username from user-123
      expect(new Date(threadDetail.date).toISOString()).toEqual(date);
    });
  });

  describe("verifyThreadExists function", () => {
    it("should throw NotFoundError when thread does not exist", async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.verifyThreadExists("thread-not-exist")
      ).rejects.toThrowError(NotFoundError);
    });

    it("should not throw NotFoundError when thread exists", async () => {
      // Arrange
      const threadId = "thread-789";
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        owner: "user-123",
      }); // Add thread to DB

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.verifyThreadExists(threadId)
      ).resolves.not.toThrow(NotFoundError);
    });
  });
});
