"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
class Utils {
    static groupBy(array, f) {
        const groups = {};
        array.forEach(o => {
            const group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(group => {
            return groups[group];
        });
    }
    static isArray(what) {
        return Object.prototype.toString.call(what) === '[object Array]';
    }
    static isEmpty(obj) {
        return Object.entries(obj).length === 0 && obj.constructor === Object;
    }
    static partition(array, filter) {
        const pass = [];
        const fail = [];
        array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
        return [pass, fail];
    }
    static returnEqClassElements(paths, item, result) {
        let i = 0;
        while (i < paths.length) {
            const element = item[paths[i]];
            if (Utils.isArray(element)) {
                for (const arrayElement of element) {
                    if (paths.length > i + 1) {
                        return this.returnEqClassElements(paths.splice(i + 1), arrayElement, result);
                    }
                    else {
                        return arrayElement;
                    }
                }
            }
            else {
                return element;
            }
            i++;
        }
        return result;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=util.js.map