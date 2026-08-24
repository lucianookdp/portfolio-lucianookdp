import { existsSync } from 'node:fs';
import path from 'node:path';

const MEDIA_DIR = path.resolve(process.cwd(), 'public/media/projects');
const EXTENSIONS = ['.mp4', '.webm', '.gif'];

export interface ProjectMedia {
  src: string;
  isVideo: boolean;
}

export function findProjectMedia(slot: string): ProjectMedia | null {
  for (const ext of EXTENSIONS) {
    if (existsSync(path.join(MEDIA_DIR, `${slot}${ext}`))) {
      return { src: `/media/projects/${slot}${ext}`, isVideo: ext !== '.gif' };
    }
  }
  return null;
}
