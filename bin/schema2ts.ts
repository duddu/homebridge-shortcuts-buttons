import { join } from 'path';
import { exit, stdout } from 'process';
import { writeFile, readFile } from 'fs/promises';
import { compile, Options } from 'json-schema-to-typescript';

import { schema } from '../config.schema.json';

const configInterfaceName = 'HSBConfig';
const moduleName = 'SchemaForm2Ts';
const outputRootPath = '/src/config.ts';
const outputRelativePath = join(__dirname, '../', outputRootPath);
const prettierrcPath = join(__dirname, '../.prettierrc');

async function main(): Promise<void> {
  deleteTitles(schema.properties);

  const config = await compile(schema as never, configInterfaceName, await getCompileOptions());

  await writeConfig(config);

  stdout.write(
    `🚀 ${moduleName}: Plugin configuration interface generated at ${outputRootPath}\n\n`,
  );

  exit(0);
}

function deleteTitles(root: object) {
  for (const key of Object.keys(root)) {
    const fieldConfig = root[key as never];
    if (fieldConfig['title']) {
      delete fieldConfig['title'];
    }
    if (fieldConfig['properties']) {
      deleteTitles(fieldConfig['properties']);
    }
    if (fieldConfig['items'] && fieldConfig['items']['properties']) {
      deleteTitles(fieldConfig['items']['properties']);
    }
  }
}

async function getCompileOptions(): Promise<Partial<Options>> {
  let style: Options['style'];
  try {
    const prettierConfig = await readFile(prettierrcPath);
    style = await JSON.parse(prettierConfig.toString());
  } catch (e) {
    throw new SchemaForm2TsError(`Unable to read Prettier configuration from ${prettierrcPath}`, e);
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

async function writeConfig(config: string): Promise<void> {
  const bannerComment =
    '/**\n * DO NOT EDIT MANUALLY.\n' +
    ' * This file was automatically generated from `/config.schema.json`.\n' +
    ' * Update the source schema file and run `schema2ts` to regenerate this file.\n */\n\n' +
    '/* eslint-disable max-len */\n\n' +
    'import { PlatformConfig } from \'homebridge\';\n\n';
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

  // for (const key of Object.keys(schema.properties)) {
  //   const fieldConfig = schema.properties[key as never];
  //   const defaultValue = fieldConfig['default'] as string | undefined;
  //   if (typeof defaultValue === 'string') {
  //     const titleValue = fieldConfig['title'] as string | undefined;
  //     config = config.replace(
  //       /(([^\n]*)\*\/)(\n\s*(\w+\s)?(\w+)(:|\s=))/gm,
  //       (_a, _b, _c, _d, _e, f) => {
  //         if ()
  //         return '';
  //       },
  //     );

  //     if (typeof titleValue === 'string') {
  //       config = config.replace(/(([^\n]*)\*\/)(\n\s*\w*\s*(Buttons|name)(:|\s=))/gm, '');
  //     } else {
  //     }
  //   }
  // }
  try {
    return await writeFile(outputRelativePath, bannerComment + config, {
      flag: 'w+',
      mode: 0o644,
    });
  } catch (e) {
    throw new SchemaForm2TsError(`Unable to write output at ${outputRootPath}`, e);
  }
}

class SchemaForm2TsError extends Error {
  constructor(message: string, exception: unknown) {
    super(`${message}\n\n   ${exception}\n`);
    Error.captureStackTrace(this, this.constructor);
    this.name = `💥 ${moduleName}`;
  }
}

(async (): Promise<void> => main()).call(null);
