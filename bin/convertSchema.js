/* eslint-disable max-len */
import { writeFile, readFile } from 'fs/promises';
import { compile } from 'json-schema-to-typescript';
import { dirname, join } from 'path';
import { exit, stdout } from 'process';
import { fileURLToPath } from 'url';
import schemaJson from '../config.schema.json' with { type: 'json' };
const __dirname = dirname(fileURLToPath(import.meta.url));
const moduleName = 'SchemaConverter';
const configInterfaceName = 'HSBConfig';
const interfaceOutputRootPath = '/src/config.ts';
const interfaceOutputRelativePath = join(__dirname, '../', interfaceOutputRootPath);
const readmeOutputRootPath = '/README.md';
const readmeOutputRelativePath = join(__dirname, '../', readmeOutputRootPath);
const prettierrcPath = join(__dirname, '../.prettierrc');
const configSchema = schemaJson.schema;
async function main() {
    await recursiveParse(configSchema.properties);
    const config = await compile(configSchema, configInterfaceName, await getCompileOptions());
    await writeConfig(config);
    exit(0);
}
let md = '| Field | Type | Default | Description |\n| :- | :- | :- | :- |\n';
async function recursiveParse(root, subLevel = false) {
    for (const key of Object.keys(root)) {
        const fieldConfig = root[key];
        const { cases } = await import('to-case');
        let fieldName = cases.title(cases.lower(key));
        if (fieldConfig['title']) {
            fieldName = fieldConfig['title'];
            delete fieldConfig['title'];
        }
        md +=
            `| ${(subLevel ? '&ensp;↳ ' : '') + fieldName} ` +
                `| \`${fieldConfig['enum'] ? fieldConfig['enum'].map((str) => `"${str}"`).join(' \\| ') : fieldConfig['type']}\` ` +
                `| ${!fieldConfig['default'] ? '-' : typeof fieldConfig['default'] === 'string' ? `\`"${fieldConfig['default']}"\`` : `\`${fieldConfig['default']}\``} ` +
                `| ${fieldConfig['description'].replaceAll('\n', '').replaceAll('|', '\\|')} |\n`;
        if (fieldConfig['properties']) {
            await recursiveParse(fieldConfig['properties'], true);
        }
        if (fieldConfig['items'] && fieldConfig['items']['properties']) {
            await recursiveParse(fieldConfig['items']['properties'], true);
        }
    }
}
async function getCompileOptions() {
    let style;
    try {
        const prettierConfig = await readFile(prettierrcPath);
        style = await JSON.parse(prettierConfig.toString());
    }
    catch (e) {
        throw new SchemaConverterError(`Unable to read Prettier configuration from ${prettierrcPath}`, e);
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
async function writeConfig(config) {
    const bannerComment = '/**\n * DO NOT EDIT MANUALLY.\n' +
        ' * This file was automatically generated from `/config.schema.json`.\n' +
        ' * Update the source schema file and run `convertSchema` to regenerate this file.\n */\n\n' +
        '/* eslint-disable max-len */\n\n' +
        "import { PlatformConfig } from 'homebridge';\n\n";
    config = config
        .replaceAll(configInterfaceName, `${configInterfaceName} extends Pick<PlatformConfig, '_bridge' | 'platform'>`)
        .replaceAll('<br>', '')
        .replaceAll('* \n', '*\n')
        .replaceAll(/export\s(\w+)\s(?!HSBConfig)/g, '$1 ')
        .replaceAll(/(([^\n]+)\*\/)(\n\s*(\w+\s)?(\w+)(:|\s=))/gm, (a, _b, c, _d, _e, f) => {
        const fieldConfig = configSchema.properties[f];
        if (fieldConfig) {
            const defaultValue = fieldConfig['default'];
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
        await writeFile(readmeOutputRelativePath, readme.replace(/(<!-- %COMPILED_CONFIG_START% .*-->)([\s\w\W]*)(<!-- %COMPILED_CONFIG_END% -->)/gm, (_a, b, _c, d) => `${b}\n\n${md.trim()}\n\n${d}`), writeFileOpts);
        stdout.write(` ‣ Plugin configuration markdown compiled in ${readmeOutputRootPath}\n\n`);
    }
    catch (e) {
        throw new SchemaConverterError('Unable to write output', e);
    }
}
class SchemaConverterError extends Error {
    constructor(message, exception) {
        super(`${message}\n\n   ${exception}\n`);
        Error.captureStackTrace(this, this.constructor);
        this.name = `💥 ${moduleName}`;
    }
}
(async () => main())();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydFNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbnZlcnRTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNEJBQTRCO0FBRTVCLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ2xELE9BQU8sRUFBRSxPQUFPLEVBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RCxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNyQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBRXBDLE9BQU8sVUFBVSxNQUFNLHVCQUF1QixDQUFDLE9BQU8sSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBRXJFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzFELE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDO0FBQ3JDLE1BQU0sbUJBQW1CLEdBQUcsV0FBVyxDQUFDO0FBQ3hDLE1BQU0sdUJBQXVCLEdBQUcsZ0JBQWdCLENBQUM7QUFDakQsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3BGLE1BQU0sb0JBQW9CLEdBQUcsWUFBWSxDQUFDO0FBQzFDLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUM5RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDekQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUV2QyxLQUFLLFVBQVUsSUFBSTtJQUNq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