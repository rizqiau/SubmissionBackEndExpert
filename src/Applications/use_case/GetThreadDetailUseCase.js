const ThreadDetail = require("../../Domains/threads/entities/ThreadDetail");
const CommentDetail = require("../../Domains/comments/entities/CommentDetail");

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyThreadExists(threadId);

    const thread = await this._threadRepository.getThreadById(threadId);

    const comments = await this._commentRepository.getCommentsByThreadId(
      threadId
    );

    const formattedComments = comments.map((comment) => {
      const commentDetail = new CommentDetail(comment);
      return {
        id: commentDetail.id,
        username: commentDetail.username,
        date: commentDetail.date,
        content: commentDetail.content,
      };
    });

    return new ThreadDetail({
      ...thread,
      comments: formattedComments,
    });
  }
}

module.exports = GetThreadDetailUseCase;
