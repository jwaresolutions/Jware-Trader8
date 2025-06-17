"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIError = void 0;
class CLIError extends Error {
    code;
    suggestion;
    exitCode;
    constructor(message, code, suggestion, exitCode = 1) {
        super(message);
        this.name = 'CLIError';
        this.code = code;
        this.suggestion = suggestion;
        this.exitCode = exitCode;
    }
}
exports.CLIError = CLIError;
//# sourceMappingURL=cli-types.js.map