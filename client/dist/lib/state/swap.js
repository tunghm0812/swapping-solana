"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLendingMarket = exports.isSwap = exports.SWAP_SIZE = exports.SwapLayout = void 0;
var buffer_layout_1 = require("buffer-layout");
var util_1 = require("../util");
exports.SwapLayout = buffer_layout_1.struct([
    buffer_layout_1.u8('version'),
    buffer_layout_1.u8('bumpSeed'),
    util_1.publicKey('owner'),
    util_1.publicKey('tokenProgramId'),
    util_1.publicKey('tokenAMint'),
    util_1.publicKey('tokenAReserve'),
    util_1.publicKey('tokenBMint'),
    util_1.publicKey('tokenBReserve'),
    util_1.u64('rateNumberator'),
    util_1.u64('rateDenominator'),
    util_1.u64('tokenABalance'),
    util_1.u64('tokenBBalance')
], 'swap');
exports.SWAP_SIZE = exports.SwapLayout.span;
exports.isSwap = function (info) {
    return info.data.length === exports.SWAP_SIZE;
};
exports.parseLendingMarket = function (pubkey, info) {
    if (!exports.isSwap(info))
        return;
    var buffer = Buffer.from(info.data);
    var swap = exports.SwapLayout.decode(buffer);
    if (!swap.version)
        return;
    return {
        pubkey: pubkey,
        info: info,
        data: swap
    };
};
//# sourceMappingURL=swap.js.map