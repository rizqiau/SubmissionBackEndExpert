const NewThread = require("../../../Domains/threads/entities/NewThread");
const ThreadRepository = require("../../../Domains/threads/ThreadRepository");
const AddThreadUseCase = require("../AddThreadUseCase");
const AddedThread = require("../../../Domains/threads/entities/AddedThread");

describe("AddThreadUseCase", () => {
  it("should orchestrating the add thread action correctly", async () => {
    const useCasePayload = {
      title: "a thread title",
      body: "a thread body",
    };
    const credentialId = "user-123";

    const stubRepositoryReturn = new AddedThread({
      id: "thread-123",
      title: useCasePayload.title,
      owner: credentialId,
    });

    const expectedAddedThread = new AddedThread({
      id: "thread-123",
      title: useCasePayload.title,
      owner: credentialId,
    });

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = jest
      .fn()
      .mockImplementation(() => Promise.resolve(stubRepositoryReturn));

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const addedThread = await addThreadUseCase.execute(
      useCasePayload,
      credentialId
    );

    // Assertion
    expect(addedThread).toStrictEqual(expectedAddedThread);

    // Assertion
    expect(mockThreadRepository.addThread).toBeCalledWith({
      title: useCasePayload.title,
      body: useCasePayload.body,
      owner: credentialId,
    });
  });
});
