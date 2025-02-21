"use strict";
// Immutable API
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = void 0;
exports.panic = panic;
exports.okResult = okResult;
exports.errResult = errResult;
/** throw exception with msg and args; use when impossible conditions occur */
function panic(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    throw new Error(msg + args.map(function (a) { return JSON.stringify(a); }).join(', '));
}
var DEFAULT_ERR_CODE = 'UNKNOWN';
var Err = /** @class */ (function (_super) {
    __extends(Err, _super);
    function Err(message, code, options) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.options = options;
        return _this;
    }
    Err.prototype.toString = function () {
        var code = this.code === DEFAULT_ERR_CODE ? '' : "".concat(this.code, ": ");
        return "".concat(code).concat(this.message);
    };
    //factory method to create an Err
    Err.err = function (e, code, opts) {
        if (code === void 0) { code = DEFAULT_ERR_CODE; }
        if (opts === void 0) { opts = {}; }
        var msg = (e instanceof Error) ? e.message : e.toString();
        return new Err(msg, code, opts);
    };
    return Err;
}(Error));
exports.Err = Err;
;
var OkResult = /** @class */ (function () {
    function OkResult(val) {
        this.isOk = true;
        this.val = val;
    }
    return OkResult;
}());
var ErrResult = /** @class */ (function () {
    function ErrResult(err) {
        this.isOk = false;
        this.err = err;
    }
    return ErrResult;
}());
function okResult(val) {
    return new OkResult(val);
}
function errResult(err) {
    return new ErrResult(err);
}
