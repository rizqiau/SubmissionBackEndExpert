const NewThread = require("../../Domains/threads/entities/NewThread");

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, credentialId) {
    const newThread = new NewThread(useCasePayload);

    newThread.owner = credentialId;
    return this._threadRepository.addThread(newThread);
  }
}

module.exports = AddThreadUseCase;
