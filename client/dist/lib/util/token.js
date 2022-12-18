"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSPLMint = exports.getSPLTokenAccount = exports.getOrCreateSPLTokenAccount = exports.createSPLTokenAccount = exports.getAssociatedTokenAddress = void 0;
var web3_js_1 = require("@solana/web3.js");
var state_1 = require("../state");
var constants_1 = require("../constants");
var instructions_1 = require("../instructions");
var send_and_confirm_transaction_1 = require("./send-and-confirm-transaction");
exports.getAssociatedTokenAddress = function (programId, mint, owner, allowOwnerOffCurve) {
    if (allowOwnerOffCurve === void 0) { allowOwnerOffCurve = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!allowOwnerOffCurve && !web3_js_1.PublicKey.isOnCurve(owner.toBuffer())) {
                        throw new Error("Owner cannot sign: " + owner.toString());
                    }
                    return [4 /*yield*/, web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], constants_1.ASSOCIATED_TOKEN_PROGRAM_ID)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results[0]];
            }
        });
    });
};
exports.createSPLTokenAccount = function (connection, mint, owner) { return __awaiter(void 0, void 0, void 0, function () {
    var associatedTokenAddress, transaction, txid;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.getAssociatedTokenAddress(constants_1.TOKEN_PROGRAM_ID, mint, owner.publicKey)];
            case 1:
                associatedTokenAddress = _a.sent();
                console.log('associatedTokenAddress', associatedTokenAddress.toBase58());
                transaction = new web3_js_1.Transaction();
                transaction.add(instructions_1.createAssociatedTokenAccountInstruction(constants_1.TOKEN_PROGRAM_ID, mint, associatedTokenAddress, owner.publicKey, owner.publicKey));
                return [4 /*yield*/, web3_js_1.sendAndConfirmTransaction(connection, transaction, [owner])];
            case 2:
                txid = _a.sent();
                console.log('createSPLTokenAccount txid', txid);
                return [2 /*return*/, associatedTokenAddress];
        }
    });
}); };
exports.getOrCreateSPLTokenAccount = function (connection, mint, owner) { return __awaiter(void 0, void 0, void 0, function () {
    var associatedTokenAddress, account, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.getAssociatedTokenAddress(constants_1.TOKEN_PROGRAM_ID, mint, owner.publicKey)];
            case 1:
                associatedTokenAddress = _a.sent();
                return [4 /*yield*/, connection.getAccountInfo(associatedTokenAddress)];
            case 2:
                account = _a.sent();
                if (account) {
                    result = state_1.parseSPLAccount(associatedTokenAddress, account);
                    if (result && result.data && result.data.state !== 0) {
                        return [2 /*return*/, associatedTokenAddress];
                    }
                }
                return [2 /*return*/, exports.createSPLTokenAccount(connection, mint, owner)];
        }
    });
}); };
exports.getSPLTokenAccount = function (connection, mint, owner) { return __awaiter(void 0, void 0, void 0, function () {
    var associatedTokenAddress, account, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.getAssociatedTokenAddress(constants_1.TOKEN_PROGRAM_ID, mint, owner)];
            case 1:
                associatedTokenAddress = _a.sent();
                return [4 /*yield*/, connection.getAccountInfo(associatedTokenAddress)];
            case 2:
                account = _a.sent();
                if (account) {
                    result = state_1.parseSPLAccount(associatedTokenAddress, account);
                    if (result && result.data && result.data.state !== 0) {
                        return [2 /*return*/, result.data];
                    }
                }
                return [2 /*return*/, null];
        }
    });
}); };
exports.getOrCreateSPLMint = function (connection, owner, symbol, decimals) { return __awaiter(void 0, void 0, void 0, function () {
    var mintPubKey, mintInfoAccount, mintInfoData, instruction, txid;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, send_and_confirm_transaction_1.initDerivedAccountWithSeed(connection, owner, constants_1.TOKEN_PROGRAM_ID, symbol, state_1.MINT_INFO_SIZE)];
            case 1:
                mintPubKey = _a.sent();
                return [4 /*yield*/, connection.getAccountInfo(mintPubKey)];
            case 2:
                mintInfoAccount = _a.sent();
                if (mintInfoAccount) {
                    mintInfoData = state_1.parseMintInfo(mintPubKey, mintInfoAccount);
                    if (mintInfoData) {
                        return [2 /*return*/, mintPubKey];
                    }
                }
                return [4 /*yield*/, instructions_1.initMintInstruction(mintPubKey, decimals, owner.publicKey, owner.publicKey)];
            case 3:
                instruction = _a.sent();
                return [4 /*yield*/, web3_js_1.sendAndConfirmTransaction(connection, new web3_js_1.Transaction().add(instruction), [owner], { commitment: 'confirmed' })];
            case 4:
                txid = _a.sent();
                return [2 /*return*/, mintPubKey];
        }
    });
}); };
//# sourceMappingURL=token.js.map