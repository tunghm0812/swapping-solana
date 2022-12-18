"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSPLAccount = exports.isSPLAccount = exports.SPL_ACCOUNT_SIZE = exports.SPLAccountLayout = exports.parseMintInfo = exports.isMintInfo = exports.MINT_INFO_SIZE = exports.MintInfoLayout = void 0;
var buffer_layout_1 = require("buffer-layout");
var util_1 = require("../util");
var States;
(function (States) {
    States[States["Uninitialized"] = 0] = "Uninitialized";
    States[States["Initialized"] = 1] = "Initialized";
    States[States["Frozen"] = 2] = "Frozen";
})(States || (States = {}));
exports.MintInfoLayout = buffer_layout_1.struct([
    buffer_layout_1.u32('mintAuthorityOption'),
    util_1.publicKey('mintAuthority'),
    util_1.u64('supply'),
    buffer_layout_1.u8('decimals'),
    buffer_layout_1.u8('isInitialized'),
    buffer_layout_1.u32('freezeAuthorityOption'),
    util_1.publicKey('freezeAuthority')
], 'mintInfo');
exports.MINT_INFO_SIZE = exports.MintInfoLayout.span;
exports.isMintInfo = function (info) {
    return info.data.length === exports.MINT_INFO_SIZE;
};
exports.parseMintInfo = function (pubkey, info) {
    if (!exports.isMintInfo(info))
        return;
    var buffer = Buffer.from(info.data);
    var mintInfo = exports.MintInfoLayout.decode(buffer);
    if (!mintInfo.isInitialized)
        return;
    return {
        pubkey: pubkey,
        info: info,
        data: mintInfo
    };
};
exports.SPLAccountLayout = buffer_layout_1.struct([
    util_1.publicKey('mint'),
    util_1.publicKey('owner'),
    util_1.u64('amount'),
    buffer_layout_1.u32('delegateOption'),
    util_1.publicKey('delegate'),
    buffer_layout_1.u8('state'),
    buffer_layout_1.u32('isNativeOption'),
    util_1.u64('isNative'),
    util_1.u64('delegatedAmount'),
    buffer_layout_1.u32('closeAuthorityOption'),
    util_1.publicKey('closeAuthority')
], 'SPLAccount');
exports.SPL_ACCOUNT_SIZE = exports.SPLAccountLayout.span;
exports.isSPLAccount = function (info) {
    return info.data.length === exports.SPL_ACCOUNT_SIZE;
};
exports.parseSPLAccount = function (pubkey, info) {
    if (!exports.isSPLAccount(info))
        return;
    var buffer = Buffer.from(info.data);
    var SPLAccount = exports.SPLAccountLayout.decode(buffer);
    SPLAccount.pubkey = pubkey;
    if (SPLAccount.state === States.Uninitialized)
        return;
    return {
        pubkey: pubkey,
        info: info,
        data: SPLAccount
    };
};
//# sourceMappingURL=token.js.map