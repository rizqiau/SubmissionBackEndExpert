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
      new CommentDetail({
        id: "comment-111",
        username: "johndoe",
        date: dateComment1,
        content: "sebuah komentar",
        is_delete: false,
      }),
      new CommentDetail({
        id: "comment-222",
        username: "dicoding",
        date: dateComment2,
        content: "komentar yang sudah dihapus", // Konten akan diubah oleh CommentDetail
        is_delete: true,
      }),
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockComments));

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    // Assert
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
    // Pastikan konten komentar yang dihapus sudah diformat
    expect(threadDetail.comments[1].content).toEqual(
      "**komentar telah dihapus**"
    );
  });
});
