/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable("comments", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    content: {
      type: "TEXT",
      notNull: true,
    },
    thread_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "threads", // Referensi ke tabel threads
      onDelete: "CASCADE", // Jika thread dihapus, komentar juga dihapus
    },
    owner: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users", // Referensi ke tabel users
      onDelete: "CASCADE", // Jika user dihapus, komentar juga dihapus
    },
    date: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    is_delete: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
  });

  // Tambahkan index pada kolom thread_id dan owner untuk performa JOIN
  pgm.addIndex("comments", "thread_id");
  pgm.addIndex("comments", "owner");
};

exports.down = (pgm) => {
  pgm.dropTable("comments");
};
