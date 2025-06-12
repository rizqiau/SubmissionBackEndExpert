class CommentDetail {
  constructor(payload) {
    this._verifyPayload(payload);

    const { id, username, date, content, is_delete } = payload;

    this.id = id;
    this.username = username;
    this.date = new Date(date).toISOString();

    this.content = is_delete ? "**komentar telah dihapus**" : content;
  }

  _verifyPayload({ id, username, date, content, is_delete }) {
    if (
      !id ||
      !username ||
      !date ||
      content === undefined ||
      is_delete === undefined
    ) {
      throw new Error("COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY");
    }

    if (
      typeof id !== "string" ||
      typeof username !== "string" ||
      typeof content !== "string" ||
      typeof is_delete !== "boolean" ||
      !(typeof date === "string" || date instanceof Date)
    ) {
      throw new Error("COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION");
    }

    if (date instanceof Date && isNaN(date.getTime())) {
      throw new Error("COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION");
    }
  }
}

module.exports = CommentDetail;
