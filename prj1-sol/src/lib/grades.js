"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Grades_rowAggrFns, _Grades_colAggrFns, _Grades_gradesData;
Object.defineProperty(exports, "__esModule", { value: true });
var E = require("./errors.js");
// application error codes are defined so that they can be mapped to
// meaningful HTTP 4xx error codes.  In particular, 400 BAD REQUEST,
// 404 NOT FOUND, 409 CONFLICT and 422 UNPROCESSABLE CONTENT.
/** store grades for multiple sections */
var Grades = /** @class */ (function () {
    function Grades(rowAggrFns, colAggrFns) {
        _Grades_rowAggrFns.set(this, void 0);
        _Grades_colAggrFns.set(this, void 0);
        _Grades_gradesData.set(this, void 0);
        // Storing arguments in private fields
        __classPrivateFieldSet(this, _Grades_rowAggrFns, rowAggrFns, "f");
        __classPrivateFieldSet(this, _Grades_colAggrFns, colAggrFns, "f");
        __classPrivateFieldSet(this, _Grades_gradesData, [], "f"); //keeps a list of raw scores...
    }
    /** add or replace student in this Grades object. */
    Grades.prototype.addStudent = function (student) {
        var index = __classPrivateFieldGet(this, _Grades_gradesData, "f").findIndex(function (s) { return s.id === student.id; });
        if (index != -1) {
            __classPrivateFieldGet(this, _Grades_gradesData, "f")[index] = student;
        }
        __classPrivateFieldGet(this, _Grades_gradesData, "f").push(student);
    };
    /** add or replace sectionInfo in this Grades object.
     *
     * Errors:
     *   BAD_CONTENT: section contains unknown aggr function name
     */
    Grades.prototype.addSectionInfo = function (sectionInfo) {
        //TODO
        return E.okResult(undefined); //indicates a successful void return
    };
    /** enroll student specified by studentId in section sectionId.  It is
     *  not an error if the student is already enrolled.
     *
     * Errors:
     *   NOT_FOUND: unknown sectionId or studentId.
     */
    Grades.prototype.enrollStudent = function (sectionId, studentId) {
        //TODO
        return E.okResult(undefined);
    };
    /** add or replace score for studentId for assignment given by colId
     *  in section sectionId.
     *
     * Errors:
     *   NOT_FOUND: unknown sectionId, studentId or colId.
     *   BAD_CONTENT: student not enrolled in section, or colId
     *   inappropriate for score.
     */
    Grades.prototype.addScore = function (sectionId, studentId, colId, score) {
        //TODO
        return E.okResult(undefined);
    };
    /** return entry at [sectionId][rowId][colId].
     *
     *  Errors:
     *    NOT_FOUND: unknown sectionId, rowId or colId.
     *    BAD_CONTENT: rowId is a studentId who is not enrolled in sectionId.
     */
    Grades.prototype.getEntry = function (sectionId, rowId, colId) {
        //TODO
        return E.okResult(null);
    };
    /** return full data (including aggregate data) for sectionId.  If
     *  rowIds is non-empty, then only the rows having those rowId's are
     *  returned.  If colIds is non-empty, then only the columns having
     *  those colId's are returned.
     *
     *  If no rowIds are specified, then the rows should be sorted by rowId,
     *  otherwise they should be in the order specified by rowIds.  If no
     *  colIds are specified, then they should be in the order specified by
     *  the sectionInfo, otherwise they should be in the order specified by
     *  colIds (ordering is possible, because JS objects preserve insertion
     *  order).
     *
     *  Note that the RowAggrFns are applied first across the rows of
     *  the table; then the ColAggrFns are applied to the columns
     *  (including AggrCols of the table.  It follows that ColAggrsFns
     *  can be applied to the result of a RowAggrFn, but RowAggrFns can
     *  never be applied to the result of a ColAggrFn.
     *
     * Errors:
     *   NOT_FOUND: unknown sectionId, rowId or colId.
     *   BAD_CONTENT: row specifies a studentId of a known but unenrolled student
     */
    Grades.prototype.getSectionData = function (sectionId, rowIds, colIds) {
        if (rowIds === void 0) { rowIds = []; }
        if (colIds === void 0) { colIds = []; }
        //TODO
        return E.okResult({});
    };
    return Grades;
}());
_Grades_rowAggrFns = new WeakMap(), _Grades_colAggrFns = new WeakMap(), _Grades_gradesData = new WeakMap();
exports.default = Grades;
;
//TODO: add local types and definitions as needed.
