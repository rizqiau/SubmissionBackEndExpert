const NewThread = require("../../Domains/threads/entities/NewThread");

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, credentialId) {
    // Tambahkan credentialId sebagai argumen
    const newThread = new NewThread(useCasePayload);
    // Tambahkan owner ke objek newThread sebelum dikirim ke repository
    newThread.owner = credentialId;
    return this._threadRepository.addThread(newThread);
  }
}

module.exports = AddThreadUseCase;
