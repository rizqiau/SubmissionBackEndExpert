class DeleteCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const { threadId, commentId, owner } = useCasePayload;

    // Pastikan thread ada
    await this._threadRepository.verifyThreadExists(threadId);
    // <<< TAMBAH BARIS INI
    await this._commentRepository.verifyCommentExists(commentId); // Pastikan komentar ada
    // ==================
    // Pastikan user adalah pemilik komentar
    await this._commentRepository.verifyCommentOwner(commentId, owner);
    // Lakukan soft delete
    await this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
