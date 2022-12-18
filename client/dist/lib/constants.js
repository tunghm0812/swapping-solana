"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NATIVE_MINT = exports.BPF_LOADER_UPGRADEABLE_ID = exports.ASSOCIATED_TOKEN_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = exports.TEST_NET_SWAP_PROGRAM_ID = exports.TEST_NET_RPC = exports.SLOTS_PER_YEAR = exports.SECONDS_PER_DAY = exports.DEFAULT_TICKS_PER_SLOT = exports.DEFAULT_TICKS_PER_SECOND = exports.U64_MAX = exports.SUPPLY_FRACTION_BASE = exports.WAD = void 0;
var web3_js_1 = require("@solana/web3.js");
var bignumber_js_1 = require("bignumber.js");
exports.WAD = new bignumber_js_1.default('1e+18');
exports.SUPPLY_FRACTION_BASE = 10000000000;
exports.U64_MAX = BigInt('18446744073709551615');
exports.DEFAULT_TICKS_PER_SECOND = 160;
exports.DEFAULT_TICKS_PER_SLOT = 64;
exports.SECONDS_PER_DAY = 24 * 60 * 60;
exports.SLOTS_PER_YEAR = (exports.DEFAULT_TICKS_PER_SECOND * exports.SECONDS_PER_DAY * 365) / exports.DEFAULT_TICKS_PER_SLOT;
exports.TEST_NET_RPC = 'https://api.testnet.solana.com';
exports.TEST_NET_SWAP_PROGRAM_ID = new web3_js_1.PublicKey('FtemqETZDWoEH7NM94HX8BYDEQmBcvJkKrRYZYXxQhhi');
exports.TOKEN_PROGRAM_ID = new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
exports.ASSOCIATED_TOKEN_PROGRAM_ID = new web3_js_1.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
exports.BPF_LOADER_UPGRADEABLE_ID = new web3_js_1.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
exports.NATIVE_MINT = new web3_js_1.PublicKey('So11111111111111111111111111111111111111112');
//# sourceMappingURL=constants.js.map