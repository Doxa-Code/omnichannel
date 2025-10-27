import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const createDatabaseConnection = () => {
  const globalForDb = globalThis as unknown as {
    sql?: ReturnType<typeof postgres>;
    db?: ReturnType<typeof drizzle>;
  };

  if (!globalForDb.sql) {
    globalForDb.sql = postgres(process.env.DATABASE_URL!, {
      max: 10,
    });
    globalForDb.db = drizzle(globalForDb.sql);
    // opcional, se quiser acessar o client original
    (globalForDb.db as any).$client = globalForDb.sql;
  }

  return globalForDb.db!;
};
