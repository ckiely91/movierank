import { Db, MongoClient } from "mongodb";

const connectionString = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER_URL}/${process.env.DB_DATABASE}?retryWrites=true&writeConcern=majority`;

export const runMongoQuery = async <T>(
  run: (db: Db) => Promise<T>
): Promise<T> => {
  let conn;

  try {
    conn = await MongoClient.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = conn.db(process.env.DB_DATABASE);

    return await run(db);
  } finally {
    if (conn) {
      conn.close();
    }
  }
};
