#!/usr/bin/env node
/**
 * TransitOps — One-shot setup script
 * Reads PGPASSWORD from environment or prompts the user.
 * Creates the databases, runs Prisma migrate, and seeds.
 *
 * Usage:
 *   node setup.js [postgres-password]
 * or set env:
 *   $env:PGPASSWORD="yourpw"; node setup.js
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PSQL = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
const CREATEDB = 'C:\\Program Files\\PostgreSQL\\18\\bin\\createdb.exe';

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

function run(cmd, env = {}) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env }, cwd: __dirname });
}

function psql(sql, env) {
  const result = spawnSync(PSQL, ['-U', 'postgres', '-h', 'localhost', '-c', sql], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return result;
}

function createDb(dbName, env) {
  const result = spawnSync(CREATEDB, ['-U', 'postgres', '-h', 'localhost', dbName], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (result.status === 0) {
    console.log(`✅ Database '${dbName}' created`);
  } else {
    // Already exists is OK
    if (result.stderr.includes('already exists')) {
      console.log(`ℹ️  Database '${dbName}' already exists — skipping`);
    } else {
      console.error(result.stderr);
      throw new Error(`Failed to create database '${dbName}'`);
    }
  }
}

async function main() {
  console.log('\n🚀 TransitOps Database Setup\n' + '─'.repeat(40));

  // 1. Get postgres password
  let pgPassword = process.argv[2] || process.env.PGPASSWORD || '';
  if (!pgPassword) {
    pgPassword = await ask('Enter PostgreSQL password for "postgres" user: ');
  }
  const pgEnv = { PGPASSWORD: pgPassword };

  // 2. Test connection
  console.log('\n🔌 Testing PostgreSQL connection...');
  const test = psql('SELECT 1', pgEnv);
  if (test.status !== 0) {
    console.error('❌ Could not connect to PostgreSQL!');
    console.error(test.stderr);
    console.error('\nPlease verify:');
    console.error('  1. PostgreSQL is running (postgresql-x64-18 service)');
    console.error('  2. The password is correct');
    process.exit(1);
  }
  console.log('✅ PostgreSQL connection successful');

  // 3. Create databases
  console.log('\n📦 Creating databases...');
  createDb('transitops_db', pgEnv);
  createDb('transitops_test', pgEnv);

  // 4. Update .env files with confirmed password
  const updateEnv = (file, pw) => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL="postgresql://postgres:${pw}@localhost:5432/${file.includes('test') ? 'transitops_test' : 'transitops_db'}?schema=public"`,
    );
    fs.writeFileSync(file, content);
    console.log(`✅ Updated ${path.basename(file)}`);
  };

  console.log('\n📝 Updating .env files...');
  updateEnv(path.join(__dirname, '.env'), pgPassword);
  updateEnv(path.join(__dirname, '.env.test'), pgPassword);

  // 5. Generate Prisma client
  console.log('\n⚙️  Generating Prisma client...');
  run('npx prisma generate', pgEnv);

  // 6. Run migrations
  console.log('\n🗄️  Running database migrations...');
  run('npx prisma migrate dev --name init --skip-seed', { ...pgEnv, DATABASE_URL: `postgresql://postgres:${pgPassword}@localhost:5432/transitops_db?schema=public` });

  // 7. Seed the database
  console.log('\n🌱 Seeding database...');
  run('npx ts-node prisma/seed.ts', { ...pgEnv, DATABASE_URL: `postgresql://postgres:${pgPassword}@localhost:5432/transitops_db?schema=public` });

  console.log('\n✅ Setup complete!\n');
  console.log('📌 Demo login credentials:');
  console.log('   fleet@transitops.com     / fleet123     (Fleet Manager)');
  console.log('   dispatch@transitops.com  / dispatch123  (Dispatcher)');
  console.log('   safety@transitops.com    / safety123    (Safety Officer)');
  console.log('   finance@transitops.com   / finance123   (Financial Analyst)');
  console.log('\n▶️  Start the backend:  npm run dev  (in d:\\TransitOps-backend)');
  console.log('▶️  Start the frontend: npm run dev  (in d:\\TransitOps\\frontend)');
  console.log('\n🌐 Backend API:  http://localhost:4000');
  console.log('🌐 Frontend:     http://localhost:5173');
  console.log('📖 Swagger UI:   http://localhost:4000/api/docs\n');
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
