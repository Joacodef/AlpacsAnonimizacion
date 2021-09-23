"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FHIRUtil = void 0;
const hmac_md5_1 = __importDefault(require("crypto-js/hmac-md5"));
const data_type_factory_1 = require("./../model/factory/data-type-factory");
class FHIRUtil {
    static hash(data) {
        if (!data)
            return '';
        return hmac_md5_1.default(data, this.secretKey).toString();
    }
    static jsonToQueryString(json = {}) {
        return '?' + Object.keys(json).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key])).join('&');
    }
    static flatten(tree) {
        return tree.reduce((acc, r) => {
            acc.push(r);
            if (r.children && r.children.length) {
                acc = acc.concat(this.flatten(r.children));
            }
            return acc;
        }, []);
    }
    static cleanJSON(obj, clearIfEmpty) {
        const propNames = Object.getOwnPropertyNames(obj);
        for (const propName of propNames) {
            if (obj[propName] === null || obj[propName] === undefined
                || (Array.isArray(obj[propName]) && !obj[propName].length)
                || (typeof obj[propName] === 'string' && !obj[propName].length)
                || (typeof obj[propName] === 'object' && !Array.isArray(obj[propName]) && !Object.getOwnPropertyNames(obj[propName]).length)) {
                delete obj[propName];
            }
        }
        if (clearIfEmpty && Object.getOwnPropertyNames(obj).length === 0) {
            return null;
        }
        return obj;
    }
    static groupBy(list, key) {
        return list.reduce((acc, curr) => {
            (acc[curr[key]] = acc[curr[key]] || []).push(curr);
            return acc;
        }, {});
    }
    static isEmpty(obj) {
        return Object.entries(obj).length === 0 && obj.constructor === Object;
    }
    /**
     * If the element have a choice of more than one data type, it takes the form nnn[x]
     * Returns true if it is in the form of multi datatype
     * @param element
     */
    static isMultiDataTypeForm(element) {
        return element.substr(element.length - 3) === '[x]';
    }
    /**
     * Returns the code of target group element matching the source code as string
     * @param conceptMap
     * @param sourceCode
     */
    static getConceptMapTargetAsString(conceptMap, sourceCode) {
        var _a, _b;
        if (((_a = conceptMap.group) === null || _a === void 0 ? void 0 : _a.length) && conceptMap.group[0].element.length) {
            const conceptMapGroupElement = conceptMap.group[0].element.find(element => element.code === sourceCode);
            if ((_b = conceptMapGroupElement === null || conceptMapGroupElement === void 0 ? void 0 : conceptMapGroupElement.target) === null || _b === void 0 ? void 0 : _b.length) {
                return conceptMapGroupElement.target[0].code || null;
            }
            else
                return null;
        }
        else
            return null;
    }
    /**
     * Returns the code and system of target group element matching the source code as CodeableConcept
     * @param conceptMap
     * @param sourceCode
     */
    static getConceptMapTargetAsCodeable(conceptMap, sourceCode) {
        const coding = FHIRUtil.getConceptMapTargetAsCoding(conceptMap, sourceCode);
        if (coding) {
            return data_type_factory_1.DataTypeFactory.createCodeableConcept(coding).toJSON();
        }
        return null;
    }
    /**
     * Returns the target group element matching the source code as Coding
     * @param conceptMap
     * @param sourceCode
     */
    static getConceptMapTargetAsCoding(conceptMap, sourceCode) {
        var _a, _b;
        if (((_a = conceptMap.group) === null || _a === void 0 ? void 0 : _a.length) && conceptMap.group[0].element.length) {
            const conceptMapGroupElement = conceptMap.group[0].element.find(element => element.code === sourceCode);
            if ((_b = conceptMapGroupElement === null || conceptMapGroupElement === void 0 ? void 0 : conceptMapGroupElement.target) === null || _b === void 0 ? void 0 : _b.length) {
                const conceptMapGroupElementTarget = conceptMapGroupElement.target[0];
                return data_type_factory_1.DataTypeFactory.createCoding({
                    code: conceptMapGroupElementTarget.code,
                    display: conceptMapGroupElementTarget.display,
                    system: conceptMap.group[0].target
                }).toJSON();
            }
            else
                return null;
        }
        else
            return null;
    }
    /**
     * Returns the Reference object according to the specified resource type
     * @param keyList
     * @param resource
     * @param phrase
     */
    static searchForReference(keyList, resource, phrase) {
        const key = keyList.find(_ => _.startsWith(phrase));
        if (key) {
            const resourceType = key.split('.').pop();
            const item = resource.get(key);
            return data_type_factory_1.DataTypeFactory.createReference({ reference: `${resourceType}/${FHIRUtil.hash(String(item.value))}` }).toJSON();
        }
        else {
            return null;
        }
    }
}
exports.FHIRUtil = FHIRUtil;
FHIRUtil.secretKey = 'E~w*c`r8e?aetZeid]b$y+aIl&p4eNr*a';
//# sourceMappingURL=fhir-util.js.map