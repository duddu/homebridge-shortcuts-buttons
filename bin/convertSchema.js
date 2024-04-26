"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const process_1 = require("process");
const promises_1 = require("fs/promises");
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const config_schema_json_1 = require("../config.schema.json");
/* eslint-disable max-len, @typescript-eslint/no-var-requires */
const moduleName = 'SchemaConverter';
const configInterfaceName = 'HSBConfig';
const interfaceOutputRootPath = '/src/config.ts';
const interfaceOutputRelativePath = (0, path_1.join)(__dirname, '../', interfaceOutputRootPath);
const readmeOutputRootPath = '/README.md';
const readmeOutputRelativePath = (0, path_1.join)(__dirname, '../', readmeOutputRootPath);
const prettierrcPath = (0, path_1.join)(__dirname, '../.prettierrc');
async function main() {
    recursiveParse(config_schema_json_1.schema.properties);
    const config = await (0, json_schema_to_typescript_1.compile)(config_schema_json_1.schema, configInterfaceName, await getCompileOptions());
    await writeConfig(config);
    (0, process_1.exit)(0);
}
let md = '| Field | Type | Default | Description |\n| :- | :- | :- | :- |\n';
function recursiveParse(root, subLevel = false) {
    for (const key of Object.keys(root)) {
        const fieldConfig = root[key];
        const toCase = require('to-case');
        let fieldName = toCase.title(toCase.lower(key));
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
            recursiveParse(fieldConfig['properties'], true);
        }
        if (fieldConfig['items'] && fieldConfig['items']['properties']) {
            recursiveParse(fieldConfig['items']['properties'], true);
        }
    }
}
async function getCompileOptions() {
    let style;
    try {
        const prettierConfig = await (0, promises_1.readFile)(prettierrcPath);
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
        'import { PlatformConfig } from \'homebridge\';\n\n';
    config = config
        .replaceAll(configInterfaceName, `${configInterfaceName} extends Pick<PlatformConfig, '_bridge' | 'platform'>`)
        .replaceAll('<br>', '')
        .replaceAll('* \n', '*\n')
        .replaceAll(/export\s(\w+)\s(?!HSBConfig)/g, '$1 ')
        .replaceAll(/(([^\n]+)\*\/)(\n\s*(\w+\s)?(\w+)(:|\s=))/gm, (a, _b, c, _d, _e, f) => {
        const fieldConfig = config_schema_json_1.schema.properties[f];
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
        await (0, promises_1.writeFile)(interfaceOutputRelativePath, bannerComment + config, writeFileOpts);
        process_1.stdout.write(`[${moduleName}]\n`);
        process_1.stdout.write(` ‣ Plugin configuration interface compiled in ${interfaceOutputRootPath}\n`);
        const readme = (await (0, promises_1.readFile)(readmeOutputRelativePath)).toString();
        await (0, promises_1.writeFile)(readmeOutputRelativePath, readme.replace(/(<!-- %COMPILED_CONFIG_START% .*-->)([\s\w\W]*)(<!-- %COMPILED_CONFIG_END% -->)/gm, (_a, b, _c, d) => `${b}\n\n${md.trim()}\n\n${d}`), writeFileOpts);
        process_1.stdout.write(` ‣ Plugin configuration markdown compiled in ${readmeOutputRootPath}\n\n`);
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
(async () => main()).call(null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydFNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbnZlcnRTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBNEI7QUFDNUIscUNBQXVDO0FBQ3ZDLDBDQUFrRDtBQUNsRCx5RUFBNkQ7QUFFN0QsOERBQStDO0FBRS9DLGdFQUFnRTtBQUVoRSxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztBQUNyQyxNQUFNLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztBQUN4QyxNQUFNLHVCQUF1QixHQUFHLGdCQUFnQixDQUFDO0FBQ2pELE1BQU0sMkJBQTJCLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3BGLE1BQU0sb0JBQW9CLEdBQUcsWUFBWSxDQUFDO0FBQzFDLE1BQU0sd0JBQXdCLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0FBQzlFLE1BQU0sY0FBYyxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXpELEtBQUssVUFBVSxJQUFJO0lBQ2pCLGNBQWMsQ0FBQywyQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRWxDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxtQ0FBTyxFQUFDLDJCQUFlLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7SUFFOUYsTUFBTSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFMUIsSUFBQSxjQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDVixDQUFDO0FBRUQsSUFBSSxFQUFFLEdBQUcsbUVBQW1FLENBQUM7QUFFN0UsU0FBUyxjQUFjLENBQUMsSUFBWSxFQUFFLFFBQVEsR0FBRyxLQUFLO0lBQ3BELEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJ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