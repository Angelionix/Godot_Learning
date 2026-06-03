import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { id: "default-user" },
    update: {},
    create: {
      id: "default-user",
      username: "student",
      xp: 0,
      level: 1,
      streak: 0,
    },
  });

  console.log(`Created user: ${user.username} (${user.id})`);

  const badges = [
    { slug: "first-project", name: "Первый проект", description: "Начни свой первый проект", userId: user.id },
    { slug: "chapter-master", name: "Мастер глав", description: "Завершите 10 глав", userId: user.id },
    { slug: "gdscript-pro", name: "GDScript Про", description: "Завершите проект на GDScript", userId: user.id },
    { slug: "cpp-warrior", name: "C++ Воин", description: "Завершите проект с C++", userId: user.id },
    { slug: "streak-7", name: "Неделя огня", description: "7 дней подряд", userId: user.id },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { userId_slug: { userId: badge.userId, slug: badge.slug } },
      update: {},
      create: badge,
    });
  }

  console.log(`Created ${badges.length} badges`);
  console.log("Seeding complete!");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
