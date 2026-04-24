import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';

for (const file of ['.env', '.env.local', '.env.production']) {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

try {
  const [providersResult] =
    await sql`select count(*)::int as count from providers`;

  if (providersResult.count === 0) {
    await sql`
      insert into providers (name, title, "desc", avatar, models)
      values
        (
          'google',
          'Google Gemini',
          'Google 的新一代 AI 模型，提供强大的多模态处理能力。',
          'https://api.dicebear.com/7.x/bottts/svg?seed=gemini',
          ${sql.json(['gemini-3-flash-preview', 'gemini-2.0-pro'])}
        ),
        (
          'deepseek',
          '深度求索',
          '国产大模型之光，极高性价比。',
          'https://api.dicebear.com/7.x/bottts/svg?seed=deepseek',
          ${sql.json(['deepseek-chat'])}
        ),
        (
          'qwen',
          '通义千问',
          '阿里自研大模型，具备极强的中文理解与生成能力。',
          'https://api.dicebear.com/7.x/bottts/svg?seed=qwen',
          ${sql.json(['qwen-turbo', 'qwen-long'])}
        )
    `;

    console.log('Database seeded successfully.');
  } else {
    console.log('Providers already exist, skipping seed.');
  }
} catch (error) {
  console.error('Database seed failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
