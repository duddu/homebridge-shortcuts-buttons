"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const process_1 = require("process");
const promises_1 = require("fs/promises");
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const config_schema_json_1 = require("../config.schema.json");
const configInterfaceName = 'HSBConfig';
const moduleName = 'SchemaForm2Ts';
const outputRootPath = '/src/config.ts';
const outputRelativePath = (0, path_1.join)(__dirname, '../', outputRootPath);
const prettierrcPath = (0, path_1.join)(__dirname, '../.prettierrc');
async function main() {
    deleteTitles(config_schema_json_1.schema.properties);
    const config = await (0, json_schema_to_typescript_1.compile)(config_schema_json_1.schema, configInterfaceName, await getCompileOptions());
    await writeConfig(config);
    process_1.stdout.write(`🚀 ${moduleName}: Plugin configuration interface generated at ${outputRootPath}\n\n`);
    (0, process_1.exit)(0);
}
function deleteTitles(root) {
    for (const key of Object.keys(root)) {
        const fieldConfig = root[key];
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
async function getCompileOptions() {
    let style;
    try {
        const prettierConfig = await (0, promises_1.readFile)(prettierrcPath);
        style = await JSON.parse(prettierConfig.toString());
    }
    catch (e) {
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
async function writeConfig(config) {
    const bannerComment = '/**\n * DO NOT EDIT MANUALLY.\n' +
        ' * This file was automatically generated from `/config.schema.json`.\n' +
        ' * Update the source schema file and run `schema2ts` to regenerate this file.\n */\n\n' +
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
        return await (0, promises_1.writeFile)(outputRelativePath, bannerComment + config, {
            flag: 'w+',
            mode: 0o644,
        });
    }
    catch (e) {
        throw new SchemaForm2TsError(`Unable to write output at ${outputRootPath}`, e);
    }
}
class SchemaForm2TsError extends Error {
    constructor(message, exception) {
        super(`${message}\n\n   ${exception}\n`);
        Error.captureStackTrace(this, this.constructor);
        this.name = `💥 ${moduleName}`;
    }
}
(async () => main()).call(null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hMnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hMnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQTRCO0FBQzVCLHFDQUF1QztBQUN2QywwQ0FBa0Q7QUFDbEQseUVBQTZEO0FBRTdELDhEQUErQztBQUUvQyxNQUFNLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUM7QUFDbkMsTUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUM7QUFDeEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ2xFLE1BQU0sY0FBYyxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXpELEtBQUssVUFBVSxJQUFJO0lBQ2pCLFlBQVksQ0FBQywyQkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRWhDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxtQ0FBTyxFQUFDLDJCQUFlLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7SUFFOUYsTUFBTSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFMUIsZ0JBQU0sQ0FBQyxLQUFLLENBQ1YsTUFBTSxVQUFVLGlEQUFpRCxjQUFjLE1BQU0sQ0FDdEYsQ0FBQztJQUVGLElBQUEsY0FBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1YsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLElBQVk7SUFDaEMsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQVksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDekIsT0FBTyxXQUFXLENBQUMs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