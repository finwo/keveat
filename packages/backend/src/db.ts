import {Level} from "level";
import {env} from "./env";

export const db = new Level(env.DATA_DIR, { valueEncoding: 'json' });
