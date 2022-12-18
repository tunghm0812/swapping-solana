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
exports.Provider = void 0;
var web3_js_1 = require("@solana/web3.js");
var instructions = require("./instructions");
var token = require("./util/token");
var constants = require("./constants");
var Provider = /** @class */ (function () {
    function Provider(network, commitment) {
        if (commitment === void 0) { commitment = 'confirmed'; }
        this.network = network;
        this.commitment = commitment;
        // this.swapProgramID = accounts.swapProgramID
    }
    Provider.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connection, version;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = new web3_js_1.Connection(this.network, this.commitment);
                        return [4 /*yield*/, connection.getVersion()];
                    case 1:
                        version = _a.sent();
                        this.connection = connection;
                        console.log('Connection to:', this.network);
                        return [2 /*return*/, connection];
                }
            });
        });
    };
    Provider.prototype.createInitSwapTx = function (programId, owner, rateNumberator, rateDenominator, swapPub, swapAuthority, tokenAMint, tokenAReserve, tokenBMint, tokenBReserve) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.newTransaction(owner)];
                    case 1:
                        transaction = _a.sent();
                        transaction.add(instructions.initSwapInstruction(programId, owner, rateNumberator, rateDenominator, swapPub, swapAuthority, tokenAMint, tokenAReserve, tokenBMint, tokenBReserve));
                        return [2 /*return*/, transaction];
                }
            });
        });
    };
    Provider.prototype.createDepositTx = function (programId, owner, swapPubkey, swapInfo, moveAmount, wsolAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, moveOwnerATA, wsolOwnerATA, wsolOwnerATAPub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!swapInfo || !swapInfo.version) {
                            throw new Error('swap not found');
                        }
                        return [4 /*yield*/, this.newTransaction(owner)];
                    case 1:
                        transaction = _a.sent();
                        return [4 /*yield*/, token.getSPLTokenAccount(this.connection, swapInfo.tokenAMint, owner)];
                    case 2:
                        moveOwnerATA = _a.sent();
                        if (!moveOwnerATA) {
                            throw new Error('MOVE owner ATA not found');
                        }
                        return [4 /*yield*/, token.getSPLTokenAccount(this.connection, constants.NATIVE_MINT, owner)];
                    case 3:
                        wsolOwnerATA = _a.sent();
                        return [4 /*yield*/, token.getAssociatedTokenAddress(constants.TOKEN_PROGRAM_ID, constants.NATIVE_MINT, owner)];
                    case 4:
                        wsolOwnerATAPub = _a.sent();
                        if (!wsolOwnerATA) {
                            transaction.add(instructions.createAssociatedTokenAccountInstruction(constants.TOKEN_PROGRAM_ID, constants.NATIVE_MINT, wsolOwnerATAPub, owner, owner));
                        }
                        transaction.add(web3_js_1.SystemProgram.transfer({
                            fromPubkey: owner,
                            toPubkey: wsolOwnerATAPub,
                            lamports: wsolAmount
                        }));
                        transaction.add(instructions.createSyncNativeInstruction(wsolOwnerATAPub));
                        transaction.add(instructions.depositInstruction(programId, owner, BigInt(moveAmount), BigInt(wsolAmount), swapPubkey, moveOwnerATA.pubkey, swapInfo.tokenAReserve, wsolOwnerATAPub, swapInfo.tokenBReserve));
                        return [2 /*return*/, transaction];
                }
            });
        });
    };
    Provider.prototype.createSwapTx = function (programId, owner, swapPubkey, swapAuthority, swapInfo, fromMint, toMint, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, moveOwnerATA, moveOwnerATAPub, wsolOwnerATA, wsolOwnerATAPub, srcFromOwnerATA, dstFromReservePDA, srcToReservePDA, dstToOwnerATA;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!swapInfo || !swapInfo.version) {
                            throw new Error('swap not found');
                        }
                        return [4 /*yield*/, this.newTransaction(owner)];
                    case 1:
                        transaction = _a.sent();
                        if (fromMint != swapInfo.tokenAMint && fromMint != swapInfo.tokenBMint) {
                            throw new Error('fromMint is invalid');
                        }
                        if (toMint != swapInfo.tokenAMint && toMint != swapInfo.tokenBMint) {
                            throw new Error('toMint is invalid');
                        }
                        return [4 /*yield*/, token.getSPLTokenAccount(this.connection, swapInfo.tokenAMint, owner)];
                    case 2:
                        moveOwnerATA = _a.sent();
                        return [4 /*yield*/, token.getAssociatedTokenAddress(constants.TOKEN_PROGRAM_ID, swapInfo.tokenAMint, owner)];
                    case 3:
                        moveOwnerATAPub = _a.sent();
                        if (!moveOwnerATA) {
                            transaction.add(instructions.createAssociatedTokenAccountInstruction(constants.TOKEN_PROGRAM_ID, swapInfo.tokenAMint, moveOwnerATAPub, owner, owner));
                        }
                        return [4 /*yield*/, token.getSPLTokenAccount(this.connection, constants.NATIVE_MINT, owner)];
                    case 4:
                        wsolOwnerATA = _a.sent();
                        return [4 /*yield*/, token.getAssociatedTokenAddress(constants.TOKEN_PROGRAM_ID, constants.NATIVE_MINT, owner)];
                    case 5:
                        wsolOwnerATAPub = _a.sent();
                        if (!wsolOwnerATA) {
                            transaction.add(instructions.createAssociatedTokenAccountInstruction(constants.TOKEN_PROGRAM_ID, constants.NATIVE_MINT, wsolOwnerATAPub, owner, owner));
                        }
                        if (fromMint.toBase58() === constants.NATIVE_MINT.toBase58()) {
                            // WSOL to token
                            transaction.add(web3_js_1.SystemProgram.transfer({
                                fromPubkey: owner,
                                toPubkey: wsolOwnerATAPub,
                                lamports: amount
                            }));
                            transaction.add(instructions.createSyncNativeInstruction(wsolOwnerATAPub));
                        }
                        srcFromOwnerATA = (fromMint.toBase58() === constants.NATIVE_MINT.toBase58()) ? wsolOwnerATAPub : moveOwnerATAPub;
                        dstFromReservePDA = (fromMint.toBase58() === constants.NATIVE_MINT.toBase58()) ? swapInfo.tokenBReserve : swapInfo.tokenAReserve;
                        srcToReservePDA = (fromMint.toBase58() === constants.NATIVE_MINT.toBase58()) ? swapInfo.tokenAReserve : swapInfo.tokenBReserve;
                        dstToOwnerATA = (fromMint.toBase58() === constants.NATIVE_MINT.toBase58()) ? moveOwnerATAPub : wsolOwnerATAPub;
                        transaction.add(instructions.swapInstruction(programId, owner, BigInt(amount), swapPubkey, swapAuthority, srcFromOwnerATA, dstFromReservePDA, srcToReservePDA, dstToOwnerATA));
                        transaction.add(instructions.createCloseAccountInstruction(wsolOwnerATAPub, owner, owner));
                        return [2 /*return*/, transaction];
                }
            });
        });
    };
    Provider.prototype.newTransaction = function (feePayer) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, blockhash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transaction = new web3_js_1.Transaction();
                        return [4 /*yield*/, this.connection.getRecentBlockhash()];
                    case 1:
                        blockhash = (_a.sent()).blockhash;
                        transaction.recentBlockhash = blockhash;
                        transaction.feePayer = feePayer;
                        return [2 /*return*/, transaction];
                }
            });
        });
    };
    return Provider;
}());
exports.Provider = Provider;
//# sourceMappingURL=provider.js.map