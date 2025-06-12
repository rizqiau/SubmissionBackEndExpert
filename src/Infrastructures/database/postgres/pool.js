const { Pool } = require("pg");
const { types } = require("pg");

types.setTypeParser(types.builtins.TIMESTAMP, (val) => {
  return new Date(val + "Z");
});
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val) => {
  return new Date(val);
});
types.setTypeParser(types.builtins.BOOL, (val) => {
  return val === "t";
});

const testConfig = {
  host: process.env.PGHOST_TEST,
  port: process.env.PGPORT_TEST,
  user: process.env.PGUSER_TEST,
  password: process.env.PGPASSWORD_TEST,
  database: process.env.PGDATABASE_TEST,
};

const pool =
  process.env.NODE_ENV === "test" ? new Pool(testConfig) : new Pool();

module.exports = pool;
