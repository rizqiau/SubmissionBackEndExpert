const ThreadDetail = require("../ThreadDetail");

describe("a ThreadDetail entities", () => {
  it("should throw error when payload did not contain needed property", () => {
    // Arrange
    const payload = {
      title: "a thread title",
      body: "a thread body",
      date: "2021-08-08T07:19:09.775Z",
      username: "dicoding",
      comments: [],
    };

    // Action & Assert
    expect(() => new ThreadDetail(payload)).toThrowError(
      "THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY"
    );
  });

  it("should throw error when payload did not meet data type specification", () => {
    // Arrange
    const payload = {
      id: 123,
      title: "a thread title",
      body: "a thread body",
      date: "2021-08-08T07:19:09.775Z",
      username: "dicoding",
      comments: "not an array",
    };

    // Action & Assert
    expect(() => new ThreadDetail(payload)).toThrowError(
      "THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION"
    );
  });

  it("should throw error when date is an invalid Date object", () => {
    // Arrange
    const payload = {
      id: "thread-123",
      title: "a thread title",
      body: "a thread body",
      date: new Date("invalid date string"),
      username: "dicoding",
      comments: [],
    };

    // Action & Assert
    expect(() => new ThreadDetail(payload)).toThrowError(
      "THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION"
    );
  });

  it("should create ThreadDetail object correctly", () => {
    // Arrange
    const payload = {
      id: "thread-123",
      title: "a thread title",
      body: "a thread body",
      date: "2021-08-08T07:19:09.775Z",
      username: "dicoding",
      comments: [
        {
          id: "comment-111",
          username: "johndoe",
          date: "2021-08-08T07:20:00.000Z",
          content: "sebuah komentar",
        },
        {
          id: "comment-222",
          username: "dicoding",
          date: "2021-08-08T07:21:00.000Z",
          content: "**komentar telah dihapus**",
        },
      ],
    };

    // Action
    const { id, title, body, date, username, comments } = new ThreadDetail(
      payload
    );

    // Assert
    expect(id).toEqual(payload.id);
    expect(title).toEqual(payload.title);
    expect(body).toEqual(payload.body);
    expect(date).toEqual(new Date(payload.date).toISOString());
    expect(username).toEqual(payload.username);
    expect(comments).toEqual(payload.comments);

    expect(Array.isArray(comments)).toBe(true);
    expect(comments).toHaveLength(2);
    expect(comments[0]).toBeInstanceOf(Object);
    expect(comments[0].id).toBeDefined();
    expect(typeof comments[0].id).toEqual("string");
    expect(comments[1].username).toBeDefined();
    expect(typeof comments[1].username).toEqual("string");
    expect(comments[1].content).toEqual("**komentar telah dihapus**");
  });
});
