class ThreadDetail {
  constructor(payload) {
    this._verifyPayload(payload);

    const { id, title, body, date, username, comments } = payload;

    this.id = id;
    this.title = title;
    this.body = body;
    this.date = new Date(date).toISOString();
    this.username = username;
    this.comments = comments;
  }

  _verifyPayload({ id, title, body, date, username, comments }) {
    if (!id || !title || !body || !date || !username || !comments) {
      throw new Error("THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY");
    }

    if (
      typeof id !== "string" ||
      typeof title !== "string" ||
      typeof body !== "string" ||
      typeof username !== "string" ||
      !Array.isArray(comments) ||
      !(typeof date === "string" || date instanceof Date)
    ) {
      throw new Error("THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION");
    }
    if (date instanceof Date && isNaN(date.getTime())) {
      throw new Error("THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION");
    }
  }
}

module.exports = ThreadDetail;
