const NewComment = require("../../Domains/comments/entities/NewComment");

class AddCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, credentialId, threadId) {
    const newComment = new NewComment(useCasePayload);

    await this._threadRepository.verifyThreadExists(threadId);

    newComment.threadId = threadId;
    newComment.owner = credentialId;

    return this._commentRepository.addComment(newComment);
  }
}

module.exports = AddCommentUseCase;
