const ThreadDetail = require("../../../Domains/threads/entities/ThreadDetail");
const CommentDetail = require("../../../Domains/comments/entities/CommentDetail");
const ThreadRepository = require("../../../Domains/threads/ThreadRepository");
const CommentRepository = require("../../../Domains/comments/CommentRepository");
const GetThreadDetailUseCase = require("../GetThreadDetailUseCase");

describe("GetThreadDetailUseCase", () => {
  it("should orchestrating the get thread detail action correctly", async () => {
    // Arrange
    const threadId = "thread-123";
    const ownerId = "user-123";
    const dateThread = new Date("2021-08-08T07:19:09.775Z").toISOString();
    const dateComment1 = new Date("2021-08-08T07:20:00.000Z").toISOString();
    const dateComment2 = new Date("2021-08-08T07:21:00.000Z").toISOString();

    const mockThread = {
      id: threadId,
      title: "sebuah thread",
      body: "sebuah body thread",
      date: dateThread,
      username: "dicoding",
    };

    const mockComments = [
      {
        id: "comment-111",
        username: "johndoe",
        date: dateComment1,
        content: "sebuah komentar",
        is_delete: false,
      },
      {
        id: "comment-222",
        username: "dicoding",
        date: dateComment2,
        content: "komentar yang sudah dihapus",
        is_delete: true,
      },
    ];

    const expectedComments = [
      {
        id: "comment-111",
        username: "johndoe",
        date: dateComment1,
        content: "sebuah komentar",
      },
      {
        id: "comment-222",
        username: "dicoding",
        date: dateComment2,
        content: "**komentar telah dihapus**",
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadExists = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockComments));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      threadId
    );
    expect(threadDetail).toStrictEqual(
      new ThreadDetail({
        ...mockThread,
        comments: expectedComments,
      })
    );
  });
});
