"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optional = exports.string2 = exports.string = exports.decimal = exports.u192 = exports.u128 = exports.u64 = exports.bigInt = exports.publicKey = exports.bool = exports.encodeDecode = void 0;
var web3_js_1 = require("@solana/web3.js");
var bignumber_js_1 = require("bignumber.js");
var buffer_layout_1 = require("buffer-layout");
var bigint_buffer_1 = require("bigint-buffer");
var constants_1 = require("../constants");
/** @internal */
exports.encodeDecode = function (layout) {
    var decode = layout.decode.bind(layout);
    var encode = layout.encode.bind(layout);
    return { decode: decode, encode: encode };
};
/** @internal */
exports.bool = function (property) {
    if (property === void 0) { property = 'bool'; }
    var layout = buffer_layout_1.u8(property);
    var _a = exports.encodeDecode(layout), encode = _a.encode, decode = _a.decode;
    var boolLayout = layout;
    boolLayout.decode = function (buffer, offset) {
        var src = decode(buffer, offset);
        return !!src;
    };
    boolLayout.encode = function (bool, buffer, offset) {
        var src = Number(bool);
        return encode(src, buffer, offset);
    };
    return boolLayout;
};
/** @internal */
exports.publicKey = function (property) {
    if (property === void 0) { property = 'publicKey'; }
    var layout = buffer_layout_1.blob(32, property);
    var _a = exports.encodeDecode(layout), encode = _a.encode, decode = _a.decode;
    var publicKeyLayout = layout;
    publicKeyLayout.decode = function (buffer, offset) {
        var src = decode(buffer, offset);
        return new web3_js_1.PublicKey(src);
    };
    publicKeyLayout.encode = function (publicKey, buffer, offset) {
        var src = publicKey.toBuffer();
        return encode(src, buffer, offset);
    };
    return publicKeyLayout;
};
/** @internal */
exports.bigInt = function (length) { return function (property) {
    if (property === void 0) { property = 'bigInt'; }
    var layout = buffer_layout_1.blob(length, property);
    var _a = exports.encodeDecode(layout), encode = _a.encode, decode = _a.decode;
    var bigIntLayout = layout;
    bigIntLayout.decode = function (buffer, offset) {
        var src = decode(buffer, offset);
        return bigint_buffer_1.toBigIntLE(src);
    };
    bigIntLayout.encode = function (bigInt, buffer, offset) {
        var src = bigint_buffer_1.toBufferLE(bigInt, length);
        return encode(src, buffer, offset);
    };
    return bigIntLayout;
}; };
/** @internal */
exports.u64 = exports.bigInt(8);
/** @internal */
exports.u128 = exports.bigInt(16);
/** @internal */
exports.u192 = exports.bigInt(24);
/** @internal */
exports.decimal = function (property, size) {
    if (property === void 0) { property = 'decimal'; }
    if (size === void 0) { size = 'u192'; }
    var layout = size === 'u192' ? exports.u192(property) : exports.u128(property);
    var _a = exports.encodeDecode(layout), encode = _a.encode, decode = _a.decode;
    var decimalLayout = layout;
    decimalLayout.decode = function (buffer, offset) {
        var src = decode(buffer, offset).toString();
        return new bignumber_js_1.default(src).div(constants_1.WAD);
    };
    decimalLayout.encode = function (decimal, buffer, offset) {
        var src = BigInt(decimal
            .times(constants_1.WAD)
            .integerValue()
            .toString());
        return encode(src, buffer, offset);
    };
    return decimalLayout;
};
/** @internal */
exports.string = function (length) { return function (property) {
    if (property === void 0) { property = 'string'; }
    var layout = buffer_layout_1.blob(length, property);
    var _a = exports.encodeDecode(layout), encode = _a.encode, decode = _a.decode;
    var stringLayout = layout;
    stringLayout.decode = function (buffer, offset) {
        var src = decode(buffer, offset);
        return src.toString('utf-8');
    };
    stringLayout.encode = function (string, buffer, offset) {
        var src = Buffer.from(string, 'utf-8');
        return encode(src, buffer, offset);
    };
    return stringLayout;
}; };
exports.string2 = function (property) {
    if (property === void 0) { property = 'string'; }
    var layout = buffer_layout_1.blob(4, property);
    var _a = exports.encodeDecode(layout), encode = _a.encode, decode = _a.decode;
    var stringLayout = layout;
    stringLayout.decode = function (buffer, offset) {
        var length = buffer.readUInt32LE(offset);
        var src = buffer.slice(offset + 4, offset + 4 + length);
        return src.toString('utf-8');
    };
    stringLayout.encode = function (string, buffer, offset) {
        var data = Buffer.from(string, 'utf-8');
        var length = Buffer.alloc(4);
        length.writeUInt32LE(data.byteLength, 0);
        var src = Buffer.concat([length, data]);
        return encode(src, buffer, offset);
    };
    stringLayout.getSpan = function (buffer, offset) {
        var length = buffer.readUInt32LE(offset);
        return 4 + length;
    };
    return stringLayout;
};
exports.optional = function (layout, property) {
    if (property === void 0) { property = 'optional'; }
    var _layout = buffer_layout_1.blob(layout.span + 1, property);
    var _a = exports.encodeDecode(_layout), encode = _a.encode, decode = _a.decode;
    var optionalLayout = _layout;
    optionalLayout.decode = function (buffer, offset) {
        var isOptional = buffer.readUInt8(offset);
        if (isOptional) {
            return layout.decode(buffer, offset + 1);
        }
        return null;
    };
    optionalLayout.encode = function (value, buffer, offset) {
        var src = Buffer.alloc(1);
        if (value) {
            var data = Buffer.alloc(layout.span + 1);
            data.writeUInt8(1, 0);
            return layout.encode(value, data, 1);
        }
        return encode(src, buffer, offset);
    };
    optionalLayout.getSpan = function (buffer, offset) {
        var isOptional = buffer.readUInt8(offset);
        if (isOptional) {
            return layout.span + 1;
        }
        return 1;
    };
    return optionalLayout;
};
//# sourceMappingURL=layout.js.map