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
    const config = await (0, json_schema_to_typescript_1.compile)(config_schema_json_1.schema, configInterfaceName, await getCompileOptions());
    await writeConfig(config);
    process_1.stdout.write(`🚀 ${moduleName}: Plugin configuration interface generated at ${outputRootPath}\n\n`);
    (0, process_1.exit)(0);
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
    const top = '/**\n * DO NOT EDIT MANUALLY.\n' +
        ' * This file was automatically generated from `/config.schema.json`.\n' +
        ' * Update the source schema file and run `schema2ts` to regenerate this file.\n */\n\n' +
        '/* eslint-disable max-len */\n\n' +
        'import { PlatformConfig } from \'homebridge\';\n\n';
    config = config
        .replaceAll('export type', 'type')
        .replaceAll(configInterfaceName, configInterfaceName + ' extends Pick<PlatformConfig, \'_bridge\' | \'platform\'>');
    try {
        return await (0, promises_1.writeFile)(outputRelativePath, top + config, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hMnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hMnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQTRCO0FBQzVCLHFDQUF1QztBQUN2QywwQ0FBa0Q7QUFDbEQseUVBQTZEO0FBRTdELDhEQUErQztBQUUvQyxNQUFNLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUM7QUFDbkMsTUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUM7QUFDeEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ2xFLE1BQU0sY0FBYyxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXpELEtBQUssVUFBVSxJQUFJO0lBQ2pCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxtQ0FBTyxFQUFDLDJCQUFlLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7SUFFOUYsTUFBTSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFMUIsZ0JBQU0sQ0FBQyxLQUFLLENBQ1YsTUFBTSxVQUFVLGlEQUFpRCxjQUFjLE1BQU0sQ0FDdEYsQ0FBQztJQUVGLElBQUEsY0FBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1YsQ0FBQztBQUVELEtBQUssVUFBVSxpQkFBaUI7SUFDOUIsSUFBSSxLQUF1QixDQUFDO0lBQzVCLElBQUksQ0FBQztRQUNILE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3RELEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDWCxNQUFNLElBQUksa0JBQWtCLENBQUMsOENBQThDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7SUFFRCxPQUFPO1FBQ0wsb0JBQW9CLEVBQUUsS0FBSztRQUMzQixhQUFhLEVBQUUsRUFBRTtRQUNqQixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIscUJBQXFCLEVBQUUsSUFBSTtRQUMzQixLQUFLO0tBQ04sQ0FBQztBQUNKLENBQUM7QUFFRCxLQUFLLFVBQVUsV0FBVyxDQUFDLE1BQWM7SUFDdkMsTUFBTSxHQUFHLEdBQ1AsaUNBQWlDO1FBQ2pDLHdFQUF3RTtRQUN4RSx3RkFBd0Y7UUFDeEYsa0NBQWtDO1FBQ2xDLG9EQUFvRCxDQUFDO0lBQ3ZELE1BQU0sR0FBRyxNQUFNO1NBQ1osVUFBVSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUM7U0FDakMsVUFBVSxDQUNULG1CQUFtQixFQUNuQixtQkFBbUIsR0FBRywyREFBMkQsQ0FDbEYsQ0FBQztJQUNKLElBQUksQ0FBQztRQUNILE9BQU8sTUFBTSxJQUFBLG9CQUFTLEVBQUMsa0JBQWtCLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRTtZQUN2RCxJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxLQUFLO1NBQ1osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDWCxNQUFNLElBQUksa0JBQWtCLENBQUMsNkJBQTZCLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7QUFDSCxDQUFDO0FBRUQsTUFBTSxrQkFBbUIsU0FBUSxLQUFLO0lBQ3BDLFlBQVksT0FBZSxFQUFFLFNBQWtCO1FBQzdDLEtBQUssQ0FBQyxHQUFHLE9BQU8sVUFBVSxTQUFTLElBQUksQ0FBQyxDQUFDO1FBQ3pDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxVQUFVLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0NBQ0Y7QUFFRCxDQUFDLEtBQUssSUFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDIn0=