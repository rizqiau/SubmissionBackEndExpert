/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable("threads", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    title: {
      type: "TEXT",
      notNull: true,
    },
    body: {
      type: "TEXT",
      notNull: true,
    },
    owner: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users", // Referensi ke tabel users
      onDelete: "CASCADE", // Jika user dihapus, thread juga dihapus
    },
    date: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Tambahkan index pada kolom owner untuk performa JOIN
  pgm.addIndex("threads", "owner");
};

exports.down = (pgm) => {
  pgm.dropTable("threads");
};
