"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var process_1 = require("process");
var promises_1 = require("fs/promises");
var json_schema_to_typescript_1 = require("json-schema-to-typescript");
var config_schema_json_1 = require("../config.schema.json");
var configInterfaceName = 'ShortcutsButtonsUserConfig';
var moduleName = 'SchemaForm2Ts';
var outputRootPath = '/src/config.ts';
var outputRelativePath = (0, path_1.join)(__dirname, '../', outputRootPath);
var prettierrcPath = (0, path_1.join)(__dirname, '../.prettierrc');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = json_schema_to_typescript_1.compile;
                    _b = [config_schema_json_1.schema, configInterfaceName];
                    return [4 /*yield*/, getCompileOptions()];
                case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([_c.sent()]))];
                case 2:
                    config = _c.sent();
                    return [4 /*yield*/, writeConfig(config)];
                case 3:
                    _c.sent();
                    process_1.stdout.write("\uD83D\uDE80 ".concat(moduleName, ": Plugin configuration interface generated at ").concat(outputRootPath, "\n\n"));
                    (0, process_1.exit)(0);
                    return [2 /*return*/];
            }
        });
    });
}
function getCompileOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var style, prettierConfig, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(prettierrcPath)];
                case 1:
                    prettierConfig = _a.sent();
                    return [4 /*yield*/, JSON.parse(prettierConfig.toString())];
                case 2:
                    style = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    throw new SchemaForm2TsError("Unable to read Prettier configuration from ".concat(prettierrcPath), e_1);
                case 4: return [2 /*return*/, {
                        additionalProperties: false,
                        bannerComment: '/**\n* DO NOT EDIT MANUALLY.\n' +
                            '* This file was automatically generated from `/config.schema.json`.\n' +
                            '* Update the source schema file and run `schema2ts` to regenerate this file.\n*/\n\n' +
                            '/* eslint-disable max-len */\n\n',
                        ignoreMinAndMaxItems: true,
                        strictIndexSignatures: true,
                        style: style,
                    }];
            }
        });
    });
}
function writeConfig(config) {
    return __awaiter(this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, promises_1.writeFile)(outputRelativePath, config, {
                            flag: 'w+',
                            mode: 420,
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_2 = _a.sent();
                    throw new SchemaForm2TsError("Unable to write output at ".concat(outputRootPath), e_2);
                case 3: return [2 /*return*/];
            }
        });
    });
}
var SchemaForm2TsError = /** @class */ (function (_super) {
    __extends(SchemaForm2TsError, _super);
    function SchemaForm2TsError(message, exception) {
        var _this = _super.call(this, "".concat(message, "\n\n   ").concat(exception, "\n")) || this;
        Error.captureStackTrace(_this, _this.constructor);
        _this.name = "\uD83D\uDCA5 ".concat(moduleName);
        return _this;
    }
    return SchemaForm2TsError;
}(Error));
(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, main()];
}); }); }).call(null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hMnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZW1hMnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkJBQTRCO0FBQzVCLG1DQUF1QztBQUN2Qyx3Q0FBa0Q7QUFDbEQsdUVBQTZEO0FBRTdELDREQUErQztBQUUvQyxJQUFNLG1CQUFtQixHQUFHLDRCQUE0QixDQUFDO0FBQ3pELElBQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQztBQUNuQyxJQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQUN4QyxJQUFNLGtCQUFrQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDbEUsSUFBTSxjQUFjLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFFekQsU0FBZSxJQUFJOzs7Ozs7b0JBQ0ksS0FBQSxtQ0FBTyxDQUFBOzBCQUFDLDJCQUFlLEVBQUUsbUJBQW1CO29CQUFFLHFCQUFNLGlCQUFpQixFQUFFLEVBQUE7d0JBQTdFLHFCQUFNLDRCQUE4QyxTQUF5QixHQUFDLEVBQUE7O29CQUF2RixNQUFNLEdBQUcsU0FBOEU7b0JBRTdGLHFCQUFNLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBQTs7b0JBQXpCLFNBQXlCLENBQUM7b0JBRTFCLGdCQUFNLENBQUMsS0FBSyxDQUNWLHVCQUFNLFVBQVUsMkRBQWlELGNBQWMsU0FBTSxDQUN0RixDQUFDO29CQUVGLElBQUEsY0FBSSxFQUFDLENBQUMsQ0FBQyxDQUFDOzs7OztDQUNUO0FBRUQsU0FBZSxpQkFBaUI7Ozs7Ozs7b0JBR0wscUJBQU0sSUFBQSxtQkFBUSxFQUFDLGNBQWMsQ0FBQyxFQUFBOztvQkFBL0MsY0FBYyxHQUFHLFNBQThCO29CQUM3QyxxQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFBOztvQkFBbkQsS0FBSyxHQUFHLFNBQTJDLENBQUM7Ozs7b0JBRXBELE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxxREFBOEMsY0FBYyxDQUFFLEVBQUUsR0FBQyxDQUFDLENBQUM7d0JBR2xHLHNCQUFPO3dCQUNMLG9CQUFvQixFQUFFLEtBQUs7d0JBQzNCLGFBQWEsRUFDWCxnQ0FBZ0M7NEJBQ2hDLHVFQUF1RTs0QkFDdkUsc0ZBQXNGOzRCQUN0RixrQ0FBa0M7d0JBQ3BDLG9CQUFvQixFQUFFLElBQUk7d0JBQzFCLHFCQUFxQixFQUFFLElBQUk7d0JBQzNCLEtBQUssT0FBQTtxQkFDTixFQUFDOzs7O0NBQ0g7QUFFRCxTQUFlLFdBQVcsQ0FBQyxNQUFjOzs7Ozs7O29CQUU5QixxQkFBTSxJQUFBLG9CQUFTLEVBQUMsa0JBQWtCLEVBQUUsTUFBTSxFQUFFOzRCQUNqRCxJQUFJLEVBQUUsSUFBSTs0QkFDVixJQUFJLEVBQUUsR0FBSzt5QkFDWixDQUFDLEVBQUE7d0JBSEYsc0JBQU8sU0FHTCxFQUFDOzs7b0JBRUgsTUFBTSxJQUFJLGtCQUFrQixDQUFDLG9DQUE2QixjQUFjLENBQUUsRUFBRSxHQUFDLENBQUMsQ0FBQzs7Ozs7Q0FFbEY7QUFFRDtJQUFpQyxzQ0FBSztJQUNwQyw0QkFBWSxPQUFlLEVBQUUsU0FBa0I7UUFDN0MsWUFBQSxNQUFLLFlBQUMsVUFBRyxPQUFPLG9CQUFVLFNBQVMsT0FBSSxDQUFDLFNBQUM7UUFDekMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQUksRUFBRSxLQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEQsS0FBSSxDQUFDLElBQUksR0FBRyx1QkFBTSxVQUFVLENBQUUsQ0FBQzs7SUFDakMsQ0FBQztJQUNILHlCQUFDO0FBQUQsQ0FBQyxBQU5ELENBQWlDLEtBQUssR0FNckM7QUFFRCxDQUFDO0lBQTJCLHNCQUFBLElBQUksRUFBRSxFQUFBO1NBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyJ9