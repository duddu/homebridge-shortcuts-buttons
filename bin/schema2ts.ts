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
  const config = await compile(schema as never, configInterfaceName, await getCompileOptions());

  await writeConfig(config);

  stdout.write(
    `🚀 ${moduleName}: Plugin configuration interface generated at ${outputRootPath}\n\n`,
  );

  exit(0);
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
  const top =
    '/**\n * DO NOT EDIT MANUALLY.\n' +
    ' * This file was automatically generated from `/config.schema.json`.\n' +
    ' * Update the source schema file and run `schema2ts` to regenerate this file.\n */\n\n' +
    '/* eslint-disable max-len */\n\n' +
    'import { PlatformConfig } from \'homebridge\';\n\n';
  config = config
    .replaceAll('export type', 'type')
    .replaceAll(
      configInterfaceName,
      configInterfaceName + ' extends Pick<PlatformConfig, \'_bridge\' | \'platform\'>',
    );
  try {
    return await writeFile(outputRelativePath, top + config, {
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
