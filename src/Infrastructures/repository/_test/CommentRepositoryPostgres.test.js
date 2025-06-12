const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const AuthorizationError = require("../../../Commons/exceptions/AuthorizationError");
const NotFoundError = require("../../../Commons/exceptions/NotFoundError");
const NewComment = require("../../../Domains/comments/entities/NewComment");
const AddedComment = require("../../../Domains/comments/entities/AddedComment");
const pool = require("../../database/postgres/pool");
const CommentRepositoryPostgres = require("../CommentRepositoryPostgres");

describe("CommentRepositoryPostgres", () => {
  let userId;
  let threadId;
  let anotherThreadId;

  beforeEach(async () => {
    userId = "user-test-comments";
    threadId = "thread-test-comments";
    anotherThreadId = "thread-another";

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
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("addComment function", () => {
    it("should persist new comment and return added comment correctly", async () => {
      const newCommentPayload = new NewComment({ content: "sebuah komentar" });
      newCommentPayload.threadId = threadId;
      newCommentPayload.owner = userId;

      const fakeIdGenerator = () => "123";
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
      const newCommentPayload = new NewComment({ content: "sebuah komentar" });
      newCommentPayload.threadId = threadId;
      newCommentPayload.owner = userId;

      const fakeIdGenerator = () => "123";
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
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      await expect(
        commentRepositoryPostgres.deleteComment("comment-invalid")
      ).rejects.toThrowError(NotFoundError);
    });

    it("should soft delete comment from database", async () => {
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
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe("verifyCommentOwner function", () => {
    it("should throw AuthorizationError when comment owner is not valid", async () => {
      const commentId = "comment-789";
      const wrongUserId = "user-wrong";
      await UsersTableTestHelper.addUser({
        id: wrongUserId,
        username: "wronguser",
      });
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.verifyCommentOwner(commentId, wrongUserId)
      ).rejects.toThrowError(AuthorizationError);
    });

    it("should not throw AuthorizationError when comment owner is valid", async () => {
      const commentId = "comment-012";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.verifyCommentOwner(commentId, userId)
      ).resolves.not.toThrow(AuthorizationError);
    });

    it("should throw NotFoundError when trying to verify owner of a deleted comment", async () => {
      const commentId = "comment-deleted";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some comment",
        threadId,
        owner: userId,
        isDeleted: true,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.verifyCommentOwner(commentId, userId)
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe("verifyCommentExists function", () => {
    it("should throw NotFoundError when comment does not exist", async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      await expect(
        commentRepositoryPostgres.verifyCommentExists("comment-not-exist")
      ).rejects.toThrowError(NotFoundError);
    });

    it("should not throw NotFoundError when comment exists", async () => {
      const commentId = "comment-exists";
      await CommentsTableTestHelper.addComment({
        id: commentId,
        content: "some content",
        threadId,
        owner: userId,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.verifyCommentExists(commentId)
      ).resolves.not.toThrow(NotFoundError);
    });
  });

  describe("getCommentsByThreadId function", () => {
    it("should return comments by threadId correctly", async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const date1 = new Date().toISOString();
      const date2 = new Date(new Date().getTime() + 1000).toISOString();

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
        threadId: anotherThreadId,
        owner: userId,
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

      const comments = await commentRepositoryPostgres.getCommentsByThreadId(
        threadId
      );

      expect(comments).toHaveLength(1);
      expect(comments[0].id).toEqual("comment-deleted-test");
      expect(comments[0].content).toEqual("original content");
      expect(comments[0].username).toEqual("commentuser");
      expect(new Date(comments[0].date).toISOString()).toEqual(date);
      expect(comments[0].is_delete).toEqual(true);
    });
  });
});
