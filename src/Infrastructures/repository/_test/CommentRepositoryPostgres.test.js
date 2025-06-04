const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper"); // Import CommentsTableTestHelper
const InvariantError = require("../../../Commons/exceptions/InvariantError");
const NotFoundError = require("../../../Commons/exceptions/NotFoundError");
const NewComment = require("../../../Domains/comments/entities/NewComment");
const AddedComment = require("../../../Domains/comments/entities/AddedComment");
const pool = require("../../database/postgres/pool");
const CommentRepositoryPostgres = require("../CommentRepositoryPostgres");

describe("CommentRepositoryPostgres", () => {
  const userId = "user-test-comments";
  const threadId = "thread-test-comments";
  const anotherThreadId = "thread-another"; // <<< TAMBAH BARIS INI

  beforeAll(async () => {
    // Add dummy user and thread for testing comments
    await UsersTableTestHelper.addUser({ id: userId, username: "commentuser" });
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
    await ThreadsTableTestHelper.addThread({
      id: anotherThreadId,
      owner: userId,
      title: "another thread",
      body: "body",
    });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("addComment function", () => {
    it("should persist new comment and return added comment correctly", async () => {
      // Arrange
      const newCommentPayload = new NewComment({
        content: "sebuah komentar",
      });
      newCommentPayload.threadId = threadId;
      newCommentPayload.owner = userId;

      const fakeIdGenerator = () => "123"; // Stub ID generator
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      await commentRepositoryPostgres.addComment(newCommentPayload);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById(
        "comment-123"
      );
      expect(comments).toHaveLength(1);
    });

    it("should return AddedComment correctly", async () => {
      // Arrange
      const newCommentPayload = new NewComment({
        content: "sebuah komentar",
      });
      newCommentPayload.threadId = threadId;
      newCommentPayload.owner = userId;

      const fakeIdGenerator = () => "123"; // Stub ID generator
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(
        newCommentPayload
      );

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: "comment-123",
          content: "sebuah komentar",
          owner: userId,
        })
      );
    });
  });

  describe("deleteComment function", () => {
    it("should throw NotFoundError when comment not found", async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        commentRepositoryPostgres.deleteComment("comment-invalid")
      ).rejects.toThrowError(NotFoundError);
    });

    it("should soft delete comment from database", async () => {
      // Arrange
      const commentId = "comment-456";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      await commentRepositoryPostgres.deleteComment(commentId);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById(commentId);
      expect(comments).toHaveLength(1); // Still exists but soft deleted
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe("verifyCommentOwner function", () => {
    it("should throw InvariantError when comment owner is not valid", async () => {
      // Arrange
      const commentId = "comment-789";
      const wrongUserId = "user-wrong";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId, // Owned by userId
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(commentId, wrongUserId)
      ).rejects.toThrowError(InvariantError);
    });

    it("should not throw InvariantError when comment owner is valid", async () => {
      // Arrange
      const commentId = "comment-012";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(commentId, userId)
      ).resolves.not.toThrow(InvariantError);
    });

    it("should throw InvariantError when trying to verify owner of a deleted comment", async () => {
      // Arrange
      const commentId = "comment-deleted";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId,
        isDeleted: true, // Mark as deleted
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(commentId, userId)
      ).rejects.toThrowError(InvariantError);
    });
  });

  describe("getCommentsByThreadId function", () => {
    it("should return comments by threadId correctly", async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const date1 = new Date().toISOString();
      const date2 = new Date(new Date().getTime() + 1000).toISOString(); // 1 second later

      await CommentsTableTestHelper.addComment({
        id: "comment-111",
        content: "comment 1",
        threadId: threadId,
        owner: userId,
        date: date1,
      });
      await CommentsTableTestHelper.addComment({
        id: "comment-222",
        content: "comment 2",
        threadId: threadId,
        owner: userId,
        date: date2,
      });
      await CommentsTableTestHelper.addComment({
        id: "comment-333",
        content: "comment 3",
        threadId: "thread-another",
        owner: userId, // different thread
      });

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(
        threadId
      );

      // Assert
      expect(comments).toHaveLength(2);
      expect(comments[0].id).toEqual("comment-111");
      expect(comments[0].content).toEqual("comment 1");
      expect(comments[0].username).toEqual("commentuser");
      expect(new Date(comments[0].date).toISOString()).toEqual(date1);
      expect(comments[0].is_delete).toEqual(false);

      expect(comments[1].id).toEqual("comment-222");
      expect(comments[1].content).toEqual("comment 2");
      expect(comments[1].username).toEqual("commentuser");
      expect(new Date(comments[1].date).toISOString()).toEqual(date2);
      expect(comments[1].is_delete).toEqual(false);
    });

    it('should return deleted comments with "komentar telah dihapus" content', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const date = new Date().toISOString();
      await CommentsTableTestHelper.addComment({
        id: "comment-deleted-test",
        content: "original content",
        threadId: threadId,
        owner: userId,
        date: date,
        isDeleted: true,
      });

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(
        threadId
      );

      // Assert
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toEqual("comment-deleted-test");
      expect(comments[0].content).toEqual("original content"); // <<< GANTI DENGAN INI
      expect(comments[0].username).toEqual("commentuser");
      expect(new Date(comments[0].date).toISOString()).toEqual(date);
      expect(comments[0].is_delete).toEqual(true); // Check the raw value first
    });
  });
});
