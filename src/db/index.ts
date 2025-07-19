import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import env from '../middleware/env';
  
const pool = mysql.createPool(env.DATABASE_URL)

const db = drizzle({ client: pool })