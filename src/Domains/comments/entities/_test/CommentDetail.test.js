const CommentDetail = require("../CommentDetail");

describe("a CommentDetail entities", () => {
  it("should throw error when payload did not contain needed property", () => {
    // Arrange
    const payload = {
      username: "dicoding",
      date: "2021-08-08T07:22:33.555Z",
      content: "sebuah comment",
      is_delete: false,
    }; // id is missing

    // Action & Assert
    expect(() => new CommentDetail(payload)).toThrowError(
      "COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY"
    );
  });

  it("should throw error when payload did not meet data type specification", () => {
    // Arrange
    const payload = {
      id: 123, // wrong data type
      username: "dicoding",
      date: "2021-08-08T07:22:33.555Z",
      content: true, // wrong data type
      is_delete: "false", // wrong data type
    };

    // Action & Assert
    expect(() => new CommentDetail(payload)).toThrowError(
      "COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION"
    );
  });

  it("should create CommentDetail object correctly when not deleted", () => {
    // Arrange
    const payload = {
      id: "comment-123",
      username: "dicoding",
      date: "2021-08-08T07:22:33.555Z",
      content: "sebuah comment",
      is_delete: false,
    };

    // Action
    const { id, username, date, content } = new CommentDetail(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(username).toEqual(payload.username);
    expect(date).toEqual(payload.date);
    expect(content).toEqual(payload.content);
  });

  it("should create CommentDetail object correctly when deleted", () => {
    // Arrange
    const payload = {
      id: "comment-123",
      username: "dicoding",
      date: "2021-08-08T07:22:33.555Z",
      content: "sebuah comment",
      is_delete: true,
    };

    // Action
    const { content } = new CommentDetail(payload);

    // Assert
    expect(content).toEqual("**komentar telah dihapus**");
  });
});
