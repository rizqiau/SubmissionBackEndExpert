const RegisterUser = require("../../../Domains/users/entities/RegisterUser");
const RegisteredUser = require("../../../Domains/users/entities/RegisteredUser");
const UserRepository = require("../../../Domains/users/UserRepository");
const PasswordHash = require("../../security/PasswordHash");
const AddUserUseCase = require("../AddUserUseCase");
const NewThread = require("../../../Domains/threads/entities/NewThread");
const ThreadRepository = require("../../../Domains/threads/ThreadRepository");
const AddThreadUseCase = require("../AddThreadUseCase");

describe("AddThreadUseCase", () => {
  it("should orchestrating the add thread action correctly", async () => {
    const useCasePayload = {
      title: "a thread title",
      body: "a thread body",
    };
    const credentialId = "user-123"; // Tambahkan ini agar test owner-nya ada

    const mockAddedThread = {
      id: "thread-123",
      title: useCasePayload.title,
      owner: credentialId,
    };

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockAddedThread));

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const addedThread = await addThreadUseCase.execute(
      useCasePayload,
      credentialId
    );

    expect(addedThread).toStrictEqual(mockAddedThread);

    // UBAH INI: Pastikan objek yang diharapkan cocok dengan apa yang benar-benar dikirim
    expect(mockThreadRepository.addThread).toBeCalledWith({
      title: useCasePayload.title,
      body: useCasePayload.body,
      owner: credentialId, // Pastikan owner ada di sini
    });
  });
});
