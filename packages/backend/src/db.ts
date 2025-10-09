import {Level} from "level";
import {env} from "./env";
import {Meta} from "./common/types";

const root = new Level(env.DATA_DIR, { valueEncoding: 'utf8' });

export const db   = root.sublevel<string, string>('data', {});
export const meta = root.sublevel<string, Meta>('meta', { valueEncoding: 'json' });
