"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const process_1 = require("process");
const promises_1 = require("fs/promises");
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const config_schema_json_1 = require("../config.schema.json");
const configInterfaceName = 'ShortcutsButtonsUserConfig';
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
        bannerComment: '/**\n* DO NOT EDIT MANUALLY.\n' +
            '* This file was automatically generated from `/config.schema.json`.\n' +
            '* Update the source schema file and run `schema2ts` to regenerate this file.\n*/\n\n' +
            '/* eslint-disable max-len */\n\n',
        ignoreMinAndMaxItems: true,
        strictIndexSignatures: true,
        style,
    };
}
async function writeConfig(config) {
    try {
        return await (0, promises_1.writeFile)(outputRelativePath, config, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hMnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hMnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQTRCO0FBQzVCLHFDQUF1QztBQUN2QywwQ0FBa0Q7QUFDbEQseUVBQTZEO0FBRTdELDhEQUErQztBQUUvQyxNQUFNLG1CQUFtQixHQUFHLDRCQUE0QixDQUFDO0FBQ3pELE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQztBQUNuQyxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQUN4QyxNQUFNLGtCQUFrQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDbEUsTUFBTSxjQUFjLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFFekQsS0FBSyxVQUFVLElBQUk7SUFDakIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLG1DQUFPLEVBQUMsMkJBQWUsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLGlCQUFpQixFQUFFLENBQUMsQ0FBQztJQUU5RixNQUFNLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUUxQixnQkFBTSxDQUFDLEtBQUssQ0FDVixNQUFNLFVBQVUsaURBQWlELGNBQWMsTUFBTSxDQUN0RixDQUFDO0lBRUYsSUFBQSxjQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDVixDQUFDO0FBRUQsS0FBSyxVQUFVLGlCQUFpQjtJQUM5QixJQUFJLEtBQXVCLENBQUM7SUFDNUIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFBLG1CQUFRLEVBQUMsY0FBYyxDQUFDLENBQUM7UUFDdEQsS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyw4Q0FBOEMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEcsQ0FBQztJQUVELE9BQU87UUFDTCxvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLGFBQWEsRUFDWCxnQ0FBZ0M7WUFDaEMsdUVBQXVFO1lBQ3ZFLHNGQUFzRjtZQUN0RixrQ0FBa0M7UUFDcEMsb0JBQW9CLEVBQUUsSUFBSTtRQUMxQixxQkFBcUIsRUFBRSxJQUFJO1FBQzNCLEtBQUs7S0FDTixDQUFDO0FBQ0osQ0FBQztBQUVELEtBQUssVUFBVSxXQUFXLENBQUMsTUFBYztJQUN2QyxJQUFJLENBQUM7UUFDSCxPQUFPLE1BQU0sSUFBQSxvQkFBUyxFQUFDLGtCQUFrQixFQUFFLE1BQU0sRUFBRTtZQUNqRCxJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxLQUFLO1NBQ1osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDWCxNQUFNLElBQUksa0JBQWtCLENBQUMsNkJBQTZCLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7QUFDSCxDQUFDO0FBRUQsTUFBTSxrQkFBbUIsU0FBUSxLQUFLO0lBQ3BDLFlBQVksT0FBZSxFQUFFLFNBQWtCO1FBQzdDLEtBQUssQ0FBQyxHQUFHLE9BQU8sVUFBVSxTQUFTLElBQUksQ0FBQyxDQUFDO1FBQ3pDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxVQUFVLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0NBQ0Y7QUFFRCxDQUFDLEtBQUssSUFBbUIsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDIn0=