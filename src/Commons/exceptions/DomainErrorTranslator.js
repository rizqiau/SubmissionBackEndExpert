const InvariantError = require("./InvariantError");
const NotFoundError = require("./NotFoundError");
const AuthorizationError = require("./AuthorizationError");

const DomainErrorTranslator = {
  translate(error) {
    return DomainErrorTranslator._directories[error.message] || error;
  },
};

DomainErrorTranslator._directories = {
  "REGISTER_USER.NOT_CONTAIN_NEEDED_PROPERTY": new InvariantError(
    "tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada"
  ),
  "REGISTER_USER.NOT_MEET_DATA_TYPE_SPECIFICATION": new InvariantError(
    "tidak dapat membuat user baru karena tipe data tidak sesuai"
  ),
  "REGISTER_USER.USERNAME_LIMIT_CHAR": new InvariantError(
    "tidak dapat membuat user baru karena karakter username melebihi batas limit"
  ),
  "REGISTER_USER.USERNAME_CONTAIN_RESTRICTED_CHARACTER": new InvariantError(
    "tidak dapat membuat user baru karena username mengandung karakter terlarang"
  ),
  "USER_LOGIN.NOT_CONTAIN_NEEDED_PROPERTY": new InvariantError(
    "harus mengirimkan username dan password"
  ),
  "USER_LOGIN.NOT_MEET_DATA_TYPE_SPECIFICATION": new InvariantError(
    "username dan password harus string"
  ),
  "REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN":
    new InvariantError("harus mengirimkan token refresh"),
  "REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION":
    new InvariantError("refresh token harus string"),
  "DELETE_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN":
    new InvariantError("harus mengirimkan token refresh"),
  "DELETE_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION":
    new InvariantError("refresh token harus string"),
  "NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY": new InvariantError(
    "tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada"
  ),
  "NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION": new InvariantError(
    "tidak dapat membuat thread baru karena tipe data tidak sesuai"
  ),
  "NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY": new InvariantError(
    "tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada"
  ),
  "NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION": new InvariantError(
    "tidak dapat membuat komentar baru karena tipe data tidak sesuai"
  ),
  "thread tidak ditemukan": new NotFoundError("thread tidak ditemukan"),
  "komentar tidak ditemukan": new NotFoundError("komentar tidak ditemukan"),
  "Anda tidak berhak menghapus komentar ini": new AuthorizationError(
    "Anda tidak berhak menghapus komentar ini"
  ),
  "THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY": new InvariantError(
    "tidak dapat menampilkan detail thread karena properti yang dibutuhkan tidak ada"
  ),
  "THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION": new InvariantError(
    "tidak dapat menampilkan detail thread karena tipe data tidak sesuai"
  ),
  "COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY": new InvariantError(
    "tidak dapat menampilkan detail komentar karena properti yang dibutuhkan tidak ada"
  ),
  "COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION": new InvariantError(
    "tidak dapat menampilkan detail komentar karena tipe data tidak sesuai"
  ),
};

module.exports = DomainErrorTranslator;
