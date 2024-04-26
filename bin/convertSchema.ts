import { join } from 'path';
import { exit, stdout } from 'process';
import { writeFile, readFile } from 'fs/promises';
import { compile, Options } from 'json-schema-to-typescript';

import { schema } from '../config.schema.json';

/* eslint-disable max-len, @typescript-eslint/no-var-requires */

const moduleName = 'SchemaConverter';
const configInterfaceName = 'HSBConfig';
const interfaceOutputRootPath = '/src/config.ts';
const interfaceOutputRelativePath = join(__dirname, '../', interfaceOutputRootPath);
const readmeOutputRootPath = '/README.md';
const readmeOutputRelativePath = join(__dirname, '../', readmeOutputRootPath);
const prettierrcPath = join(__dirname, '../.prettierrc');

async function main(): Promise<void> {
  recursiveParse(schema.properties);

  const config = await compile(schema as never, configInterfaceName, await getCompileOptions());

  await writeConfig(config);

  exit(0);
}

let md = '| Field | Type | Default | Description |\n| :- | :- | :- | :- |\n';

function recursiveParse(root: object, subLevel = false) {
  for (const key of Object.keys(root)) {
    const fieldConfig = root[key as never];
    const toCase = require('to-case');
    let fieldName = toCase.title(toCase.lower(key));
    if (fieldConfig['title']) {
      fieldName = fieldConfig['title'];
      delete fieldConfig['title'];
    }
    md +=
      `| ${(subLevel ? '&ensp;↳ ' : '') + fieldName} ` +
      `| \`${fieldConfig['enum'] ? (fieldConfig['enum'] as []).map((str) => `"${str}"`).join(' \\| ') : fieldConfig['type']}\` ` +
      `| ${!fieldConfig['default'] ? '-' : typeof fieldConfig['default'] === 'string' ? `\`"${fieldConfig['default']}"\`` : `\`${fieldConfig['default']}\``} ` +
      `| ${(fieldConfig['description'] as string).replaceAll('\n', '').replaceAll('|', '\\|')} |\n`;
    if (fieldConfig['properties']) {
      recursiveParse(fieldConfig['properties'], true);
    }
    if (fieldConfig['items'] && fieldConfig['items']['properties']) {
      recursiveParse(fieldConfig['items']['properties'], true);
    }
  }
}

async function getCompileOptions(): Promise<Partial<Options>> {
  let style: Options['style'];
  try {
    const prettierConfig = await readFile(prettierrcPath);
    style = await JSON.parse(prettierConfig.toString());
  } catch (e) {
    throw new SchemaConverterError(
      `Unable to read Prettier configuration from ${prettierrcPath}`,
      e,
    );
  }

  return {
    additionalProperties: false,
    bannerComment: '',
    enableConstEnums: true,
    ignoreMinAndMaxItems: true,
    strictIndexSignatures: true,
    style,
  };
}

const writeFileOpts = {
  flag: 'w+',
  mode: 0o644,
};

async function writeConfig(config: string): Promise<void> {
  const bannerComment =
    '/**\n * DO NOT EDIT MANUALLY.\n' +
    ' * This file was automatically generated from `/config.schema.json`.\n' +
    ' * Update the source schema file and run `convertSchema` to regenerate this file.\n */\n\n' +
    '/* eslint-disable max-len */\n\n' +
    "import { PlatformConfig } from 'homebridge';\n\n";
  config = config
    .replaceAll(
      configInterfaceName,
      `${configInterfaceName} extends Pick<PlatformConfig, '_bridge' | 'platform'>`,
    )
    .replaceAll('<br>', '')
    .replaceAll('* \n', '*\n')
    .replaceAll(/export\s(\w+)\s(?!HSBConfig)/g, '$1 ')
    .replaceAll(/(([^\n]+)\*\/)(\n\s*(\w+\s)?(\w+)(:|\s=))/gm, (a, _b, c, _d, _e, f) => {
      const fieldConfig = schema.properties[f as never];
      if (fieldConfig) {
        const defaultValue = fieldConfig['default'] as unknown;
        if (defaultValue) {
          const defaultStr = typeof defaultValue === 'string' ? `"${defaultValue}"` : defaultValue;
          return `${c}*\n${c}* @default ${defaultStr}\n${a}`;
        }
      }
      return a;
    });

  try {
    await writeFile(interfaceOutputRelativePath, bannerComment + config, writeFileOpts);
    stdout.write(`[${moduleName}]\n`);
    stdout.write(` ‣ Plugin configuration interface compiled in ${interfaceOutputRootPath}\n`);
    const readme = (await readFile(readmeOutputRelativePath)).toString();
    await writeFile(
      readmeOutputRelativePath,
      readme.replace(
        /(<!-- %COMPILED_CONFIG_START% .*-->)([\s\w\W]*)(<!-- %COMPILED_CONFIG_END% -->)/gm,
        (_a, b, _c, d) => `${b}\n\n${md.trim()}\n\n${d}`,
      ),
      writeFileOpts,
    );
    stdout.write(` ‣ Plugin configuration markdown compiled in ${readmeOutputRootPath}\n\n`);
  } catch (e) {
    throw new SchemaConverterError('Unable to write output', e);
  }
}

class SchemaConverterError extends Error {
  constructor(message: string, exception: unknown) {
    super(`${message}\n\n   ${exception}\n`);
    Error.captureStackTrace(this, this.constructor);
    this.name = `💥 ${moduleName}`;
  }
}

(async (): Promise<void> => main()).call(null);
