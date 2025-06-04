const NewComment = require("../../Domains/comments/entities/NewComment");

class AddCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, credentialId, threadId) {
    // Validasi payload
    const newComment = new NewComment(useCasePayload);

    // Verifikasi thread
    await this._threadRepository.verifyThreadExists(threadId);

    // Tambahkan threadId dan owner ke newComment
    newComment.threadId = threadId;
    newComment.owner = credentialId;

    return this._commentRepository.addComment(newComment);
  }
}

module.exports = AddCommentUseCase;
