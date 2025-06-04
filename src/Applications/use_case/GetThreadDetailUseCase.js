const ThreadDetail = require("../../Domains/threads/entities/ThreadDetail");
const CommentDetail = require("../../Domains/comments/entities/CommentDetail");

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    // 1. Dapatkan detail thread dasar
    const thread = await this._threadRepository.getThreadById(threadId);

    // 2. Dapatkan komentar-komentar yang terkait dengan thread ini
    const comments = await this._commentRepository.getCommentsByThreadId(
      threadId
    );

    // 3. Format komentar menggunakan CommentDetail
    const formattedComments = comments.map(
      (comment) => new CommentDetail(comment)
    );

    // 4. Gabungkan thread detail dengan komentar yang sudah diformat
    return new ThreadDetail({
      ...thread,
      comments: formattedComments,
    });
  }
}

module.exports = GetThreadDetailUseCase;
