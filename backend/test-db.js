
const prisma = require("./config/prisma");

async function main() {
  await prisma.$connect();
  console.log("PostgreSQL connected successfully!");
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
