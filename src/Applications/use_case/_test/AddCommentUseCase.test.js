const NewComment = require("../../../Domains/comments/entities/NewComment");
const AddedComment = require("../../../Domains/comments/entities/AddedComment");
const ThreadRepository = require("../../../Domains/threads/ThreadRepository"); // Import ThreadRepository
const CommentRepository = require("../../../Domains/comments/CommentRepository"); // Import CommentRepository
const AddCommentUseCase = require("../AddCommentUseCase");

describe("AddCommentUseCase", () => {
  it("should orchestrating the add comment action correctly", async () => {
    // Arrange
    const useCasePayload = {
      content: "sebuah komentar",
    };
    const threadId = "thread-123";
    const credentialId = "user-123";

    const mockAddedComment = new AddedComment({
      id: "comment-123",
      content: useCasePayload.content,
      owner: credentialId,
    });

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    /** mocking needed function */
    mockThreadRepository.verifyThreadExists = jest
      .fn()
      .mockImplementation(() => Promise.resolve()); // Mock success for thread existence
    mockCommentRepository.addComment = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockAddedComment));

    /** creating use case instance */
    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(
      useCasePayload,
      credentialId,
      threadId
    );

    // Assert
    expect(addedComment).toStrictEqual(
      new AddedComment({
        id: "comment-123",
        content: "sebuah komentar",
        owner: "user-123",
      })
    );

    // Ensure verifyThreadExists is called with correct threadId
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);

    // Ensure addComment is called with correct NewComment object
    expect(mockCommentRepository.addComment).toBeCalledWith({
      // <<< UBAH INI
      content: "sebuah komentar",
      threadId: threadId,
      owner: credentialId,
    });
  });
});
