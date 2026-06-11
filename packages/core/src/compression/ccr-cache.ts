import { readText, writeText, ensureDir } from '../utils/fs.js';
import { cacheDir } from '../utils/paths.js';
import { join } from 'node:path';

export class CCRCache {
  private dir: string;

  constructor(projectRoot: string) {
    this.dir = cacheDir(projectRoot);
    ensureDir(this.dir);
  }

  store(id: string, content: string): string {
    writeText(join(this.dir, `${id}.md`), content);
    return id;
  }

  retrieve(id: string): string | null {
    return readText(join(this.dir, `${id}.md`));
  }
}
