import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export function writeJson(filePath: string, data: unknown): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function readYaml(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  return parseSimpleYaml(content);
}

export function writeYaml(filePath: string, data: Record<string, unknown>): void {
  ensureDir(dirname(filePath));
  const content = serializeSimpleYaml(data);
  writeFileSync(filePath, content, 'utf-8');
}

export function readText(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}

export function writeText(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');
  let currentKey = '';
  let currentArray: string[] | null = null;

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;

    const arrayMatch = line.match(/^\s+-\s+(.+)/);
    if (arrayMatch && currentKey) {
      if (!currentArray) currentArray = [];
      currentArray.push(arrayMatch[1].trim());
      result[currentKey] = currentArray;
      continue;
    }

    const kvMatch = line.match(/^(\w[\w.]*)\s*:\s*(.*)/);
    if (kvMatch) {
      if (currentArray) currentArray = null;
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value === '') {
        result[currentKey] = {};
      } else if (value === 'true') {
        result[currentKey] = true;
      } else if (value === 'false') {
        result[currentKey] = false;
      } else if (value === 'null') {
        result[currentKey] = null;
      } else if (/^\d+$/.test(value)) {
        result[currentKey] = parseInt(value, 10);
      } else {
        result[currentKey] = value.replace(/^["']|["']$/g, '');
      }
    }
  }
  return result;
}

function serializeSimpleYaml(data: Record<string, unknown>, indent = 0): string {
  let output = '';
  const prefix = '  '.repeat(indent);

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      output += `${prefix}${key}: null\n`;
    } else if (typeof value === 'boolean') {
      output += `${prefix}${key}: ${value}\n`;
    } else if (typeof value === 'number') {
      output += `${prefix}${key}: ${value}\n`;
    } else if (typeof value === 'string') {
      output += `${prefix}${key}: ${value}\n`;
    } else if (Array.isArray(value)) {
      output += `${prefix}${key}:\n`;
      for (const item of value) {
        output += `${prefix}  - ${item}\n`;
      }
    } else if (typeof value === 'object') {
      output += `${prefix}${key}:\n`;
      output += serializeSimpleYaml(value as Record<string, unknown>, indent + 1);
    }
  }
  return output;
}
