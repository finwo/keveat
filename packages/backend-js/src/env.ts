import 'dotenv/config';
import { cleanEnv, num, str } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  DATA_DIR: str({ default: __dirname + '/../data' }),
});
