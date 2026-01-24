import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "admin@flownau.com";
    const password = "password123"; // CHANGE THIS IN PRODUCTION

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("🌱 Seeding database...");

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: "Admin User",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    const workspace = await prisma.workspace.upsert({
        where: { slug: "default" },
        update: {},
        create: {
            name: "Main Workspace",
            slug: "default",
            members: {
                create: {
                    userId: user.id,
                    role: "OWNER",
                },
            },
        },
    });

    console.log(`✅ Seeded: User(${email}) in Workspace(${workspace.slug})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
