"use strict";
/** @internal */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapInstruction = exports.TokenInstruction = void 0;
var TokenInstruction;
(function (TokenInstruction) {
    TokenInstruction[TokenInstruction["InitMint"] = 0] = "InitMint";
    TokenInstruction[TokenInstruction["InitializeAccount"] = 1] = "InitializeAccount";
    TokenInstruction[TokenInstruction["Transfer"] = 3] = "Transfer";
    TokenInstruction[TokenInstruction["MintTo"] = 7] = "MintTo";
    TokenInstruction[TokenInstruction["CloseAccount"] = 9] = "CloseAccount";
    TokenInstruction[TokenInstruction["SyncNative"] = 17] = "SyncNative";
})(TokenInstruction = exports.TokenInstruction || (exports.TokenInstruction = {}));
var SwapInstruction;
(function (SwapInstruction) {
    SwapInstruction[SwapInstruction["InitSwap"] = 0] = "InitSwap";
    SwapInstruction[SwapInstruction["Deposit"] = 1] = "Deposit";
    SwapInstruction[SwapInstruction["Swap"] = 2] = "Swap";
})(SwapInstruction = exports.SwapInstruction || (exports.SwapInstruction = {}));
//# sourceMappingURL=instruction.js.map