import "dotenv/config";
import postgres from "postgres";
const client = postgres(process.env.DATABASE_URL!, { connect_timeout: 3 });
try {
  const [row] = await client`select count(*)::int as count from users`;
  const columns =
    await client`select column_name from information_schema.columns where table_schema=current_schema() and table_name='users'`;
  console.log(
    JSON.stringify({
      connected: true,
      users: row.count,
      hasRoles: columns.some((c) => c.column_name === "role"),
    }),
  );
} catch (error) {
  console.log(
    JSON.stringify({
      connected: false,
      code:
        error && typeof error === "object" && "code" in error
          ? error.code
          : "unavailable",
    }),
  );
} finally {
  await client.end();
}
