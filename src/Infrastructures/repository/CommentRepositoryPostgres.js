const CommentRepository = require("../../Domains/comments/CommentRepository");
const AddedComment = require("../../Domains/comments/entities/AddedComment");
const NotFoundError = require("../../Commons/exceptions/NotFoundError");
const InvariantError = require("../../Commons/exceptions/InvariantError"); // Import InvariantError jika digunakan
const AuthorizationError = require("../../Commons/exceptions/AuthorizationError"); // <<< TAMBAH BARIS INI

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, threadId, owner } = newComment; // threadId dan owner akan di-attach di Use Case
    const id = `comment-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: "INSERT INTO comments VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner",
      values: [id, content, threadId, owner, date],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async deleteComment(commentId) {
    const query = {
      text: "UPDATE comments SET is_delete = TRUE WHERE id = $1 RETURNING id",
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("komentar tidak ditemukan");
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: "SELECT owner, is_delete FROM comments WHERE id = $1", // Ambil owner dan is_delete
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("komentar tidak ditemukan"); // Jika tidak ada, berarti tidak ditemukan
    }

    const comment = result.rows[0];
    if (comment.is_delete) {
      // Jika komentar sudah dihapus
      throw new NotFoundError("komentar tidak ditemukan"); // Tetap dianggap tidak ditemukan
    }

    if (comment.owner !== owner) {
      throw new AuthorizationError("Anda tidak berhak menghapus komentar ini"); // Jika pemilik tidak cocok
    }
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `
        SELECT
          comments.id, comments.content, comments.date, users.username, comments.is_delete
        FROM comments
        LEFT JOIN users ON comments.owner = users.id
        WHERE comments.thread_id = $1
        ORDER BY comments.date ASC
      `,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    console.log("Raw comments data from DB:", result.rows); // <<< TAMBAH BARIS INI UNTUK DEBUGGING
    return result.rows;
  }

  async verifyCommentExists(commentId) {
    const query = {
      text: "SELECT id FROM comments WHERE id = $1",
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("komentar tidak ditemukan");
    }
  }
}

module.exports = CommentRepositoryPostgres;
