const ThreadDetail = require("../../Domains/threads/entities/ThreadDetail");
const CommentDetail = require("../../Domains/comments/entities/CommentDetail"); // Pastikan ini diimport

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    // 1. Verifikasi thread ada terlebih dahulu (sesuai catatan mentor)
    await this._threadRepository.verifyThreadExists(threadId); // <<< TAMBAH BARIS INI

    // 2. Dapatkan detail thread dasar
    const thread = await this._threadRepository.getThreadById(threadId);

    // 3. Dapatkan komentar-komentar yang terkait dengan thread ini
    const comments = await this._commentRepository.getCommentsByThreadId(
      threadId
    );

    // 4. Format komentar menggunakan CommentDetail DAN konversi ke objek literal
    const formattedComments = comments.map((comment) => {
      // Buat instance CommentDetail untuk validasi dan pemformatan
      const commentDetail = new CommentDetail(comment);
      // Kemudian, konversi ke objek literal sesuai ekspektasi mentor
      return {
        id: commentDetail.id,
        username: commentDetail.username,
        date: commentDetail.date,
        content: commentDetail.content, // Ini sudah akan berisi "**komentar telah dihapus**" jika is_delete: true
      };
    });

    // 5. Gabungkan thread detail dengan komentar yang sudah diformat (sebagai array of Anonymous Object)
    return new ThreadDetail({
      ...thread,
      comments: formattedComments, // Ini sekarang adalah Array of Anonymous Object
    });
  }
}

module.exports = GetThreadDetailUseCase;
