"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specToSectionInfo = specToSectionInfo;
exports.isStudentId = isStudentId;
exports.toStudentId = toStudentId;
exports.chkStudentId = chkStudentId;
exports.toAggrRowId = toAggrRowId;
exports.chkAggrRowId = chkAggrRowId;
var E = require("./errors.js");
/******************** Utility Functions for Types **********************/
/** Convert external spec having optional properties and lists to
 *  value used internally with no optional properties and maps
 *  instead of lists.
 */
function specToSectionInfo(spec) {
    var rCategs = spec.categories.map(function (c) {
        return c.entryType === 'textScore' ? c : __assign({ min: 0, max: 100 }, c);
    });
    var categories = Object.fromEntries(rCategs.map(function (c) { return [c.id, c]; }));
    var rColHdrs = spec.colHdrs.map(function (h) {
        switch (h._tag) {
            case 'student':
                return __assign({ entryType: 'text' }, h);
            case 'aggrCol':
                return __assign({ args: [], entryType: 'num' }, h);
            case 'numScore': {
                var category = categories[h.categoryId];
                return __assign({ min: category.min, max: category.max, entryType: category.entryType }, h);
            }
            case 'textScore': {
                var category = categories[h.categoryId];
                return __assign({ vals: category.vals, entryType: category.entryType }, h);
            }
        }
    });
    var rRowHdrs = spec.rowHdrs.map(function (h) {
        switch (h._tag) {
            case 'aggrRow':
                return __assign({ args: [] }, h);
        }
    });
    var colHdrs = Object.fromEntries(rColHdrs.map(function (h) { return [h.id, h]; }));
    var rowHdrs = Object.fromEntries(rRowHdrs.map(function (h) { return [h.id, h]; }));
    return { id: spec.id, name: spec.name, categories: categories, colHdrs: colHdrs, rowHdrs: rowHdrs };
}
/************************** Branding Checks ****************************/
var NON_STUDENT_BRAND = '$';
//since both StudentId's and AggrRowId's can be RowId's, ensure that
//the branded ids are disjoint.
//this is a type predicate: when TS sees it returning true,
//it infers that str has type StudentId
function isStudentId(str) {
    return !str.startsWith(NON_STUDENT_BRAND);
}
//this function is meant for use in literal data as it throws.
function toStudentId(str) {
    if (!str.startsWith(NON_STUDENT_BRAND)) {
        return str;
    }
    else {
        throw new Error("\"".concat(str, "\" is not a valid StudentId as it starts with \"$\""));
    }
}
//this function is meant for use in code as it does not throw
function chkStudentId(str) {
    try {
        return E.okResult(toStudentId(str));
    }
    catch (e) {
        return E.errResult(e);
    }
}
//this function is meant for use in literal data as it throws.
function toAggrRowId(str) {
    if (str.startsWith(NON_STUDENT_BRAND)) {
        return str;
    }
    else {
        var msg = "\"".concat(str, "\" is not a valid AggrRowId as it does not start with \"$\"");
        throw new Error(msg);
    }
}
//this function is meant for use in code as it does not throw
function chkAggrRowId(str) {
    try {
        return E.okResult(toAggrRowId(str));
    }
    catch (e) {
        return E.errResult(e);
    }
}
