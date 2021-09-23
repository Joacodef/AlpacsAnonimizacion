"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sheet = exports.FileSource = void 0;
class FileSource {
    constructor(path) {
        this.sheets = [];
        this.currentSheet = null;
        this.path = path;
        this.label = path.split('\\').pop() || '';
        this.extension = this.label.split('.').pop() || '';
    }
}
exports.FileSource = FileSource;
class Sheet {
    constructor(name) {
        this.value = name;
        this.label = name;
    }
}
exports.Sheet = Sheet;
//# sourceMappingURL=file-source.js.map