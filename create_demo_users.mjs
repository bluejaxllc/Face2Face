import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
const { Client } = pg;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
}

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway';
const client = new Client({ connectionString: dbUrl });

const dallasCenter = [32.8728576, -96.5312512];

function getRandomCoordinate(base) {
    return (base + (Math.random() * 0.4 - 0.2)).toFixed(6);
}

const names = [
    { first: 'James', last: 'Smith', gender: 'male' },
    { first: 'Emma', last: 'Johnson', gender: 'female' },
    { first: 'Michael', last: 'Williams', gender: 'male' },
    { first: 'Olivia', last: 'Brown', gender: 'female' },
    { first: 'William', last: 'Jones', gender: 'male' },
    { first: 'Ava', last: 'Garcia', gender: 'female' },
    { first: 'Alexander', last: 'Martinez', gender: 'male' },
    { first: 'Sophia', last: 'Rodriguez', gender: 'female' },
    { first: 'Daniel', last: 'Hernandez', gender: 'male' },
    { first: 'Isabella', last: 'Lopez', gender: 'female' },
    { first: 'Matthew', last: 'Gonzalez', gender: 'male' },
    { first: 'Mia', last: 'Perez', gender: 'female' },
];

async function run() {
    await client.connect();

    // Hash password once, "password123"
    const hashedPassword = await hashPassword('password123');

    for (let count = 0; count < names.length; count++) {
        const p = names[count];
        const username = `demo_${p.first.toLowerCase()}_${count}`;
        const email = `${username}@example.com`;

        // Random age between 20 and 35
        const age = Math.floor(Math.random() * 16) + 20;
        // Random category
        const category = Math.random() > 0.5 ? 'casual' : 'intimate';
        // Random rating 1-10
        const rating = Math.floor(Math.random() * 10) + 1;

        const lat = getRandomCoordinate(dallasCenter[0]);
        const lon = getRandomCoordinate(dallasCenter[1]);

        try {
            await client.query(`
                INSERT INTO users 
                (username, password, first_name, last_name, gender, category, age, self_rating, is_active, latitude, longitude, email, phone_number, is_phone_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12, true)
                ON CONFLICT (username) DO UPDATE SET
                latitude = $9, longitude = $10, is_active = true, self_rating = $8
            `, [username, hashedPassword, p.first, p.last, p.gender, category, age, rating, lat, lon, email, `+1555000${count.toString().padStart(4, '0')}`]);
            console.log(`Created/Updated: ${username} (${p.gender}) at ${lat}, ${lon}`);
        } catch (e) {
            console.error(`Error with user ${username}:`, e);
            // fallback if table columns are camelCase
            try {
                await client.query(`
                   INSERT INTO users 
                   (username, password, "firstName", "lastName", gender, category, age, "selfRating", "isActive", latitude, longitude, email, "phoneNumber", "isPhoneVerified")
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12, true)
                   ON CONFLICT (username) DO UPDATE SET
                   latitude = $9, longitude = $10, "isActive" = true, "selfRating" = $8
               `, [username, hashedPassword, p.first, p.last, p.gender, category, age, rating, lat, lon, email, `+1555000${count.toString().padStart(4, '0')}`]);
                console.log(`Created/Updated (camelCase fallback): ${username} (${p.gender}) at ${lat}, ${lon}`);
            } catch (e2) {
                console.error(`Error with user ${username} (fallback):`, e2);
            }
        }
    }

    await client.end();
}

run().catch(console.error);
