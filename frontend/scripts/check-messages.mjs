import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const messagesDir = path.resolve(process.cwd(), "messages");
const localeDirs = ["zh-CN", "en-US"];

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadLocaleModules(locale) {
  const localeDir = path.join(messagesDir, locale);
  const entries = await readdir(localeDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const modules = {};

  for (const fileName of files) {
    const moduleName = fileName.replace(/\.json$/, "");
    const filePath = path.join(localeDir, fileName);
    const content = JSON.parse(await readFile(filePath, "utf8"));
    modules[moduleName] = content;
  }

  return { files, modules };
}

function collectKeyPaths(value, prefix = "") {
  if (!isObject(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    return collectKeyPaths(child, nextPath);
  });
}

const [baseLocale, ...otherLocales] = localeDirs;
const base = await loadLocaleModules(baseLocale);
const errors = [];

for (const locale of otherLocales) {
  const current = await loadLocaleModules(locale);
  const baseFiles = new Set(base.files);
  const currentFiles = new Set(current.files);

  for (const fileName of base.files) {
    if (!currentFiles.has(fileName)) {
      errors.push(`[${locale}] missing module file: ${fileName}`);
    }
  }

  for (const fileName of current.files) {
    if (!baseFiles.has(fileName)) {
      errors.push(`[${locale}] unexpected module file: ${fileName}`);
    }
  }

  for (const fileName of base.files) {
    if (!currentFiles.has(fileName)) {
      continue;
    }

    const moduleName = fileName.replace(/\.json$/, "");
    const baseKeys = new Set(collectKeyPaths(base.modules[moduleName]));
    const currentKeys = new Set(collectKeyPaths(current.modules[moduleName]));

    for (const keyPath of baseKeys) {
      if (!currentKeys.has(keyPath)) {
        errors.push(
          `[${locale}] missing key in ${fileName}: ${moduleName}.${keyPath}`
        );
      }
    }

    for (const keyPath of currentKeys) {
      if (!baseKeys.has(keyPath)) {
        errors.push(
          `[${locale}] unexpected key in ${fileName}: ${moduleName}.${keyPath}`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Message catalog validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Message catalogs are aligned.");
