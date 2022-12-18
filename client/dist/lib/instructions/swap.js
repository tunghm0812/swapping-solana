"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapInstruction = exports.SwapDataLayout = exports.depositInstruction = exports.DepositDataLayout = exports.initSwapInstruction = exports.InitSwapDataLayout = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var buffer_layout_1 = require("buffer-layout");
var util_1 = require("../util");
var instruction_1 = require("./instruction");
exports.InitSwapDataLayout = buffer_layout_1.struct([
    buffer_layout_1.u8('instruction'),
    util_1.publicKey('owner'),
    util_1.u64('rateNumberator'),
    util_1.u64('rateDenominator')
]);
exports.initSwapInstruction = function (programId, owner, rateNumberator, rateDenominator, swapPub, swapAuthority, tokenAMint, tokenAReserve, tokenBMint, tokenBReserve) {
    var data = Buffer.alloc(exports.InitSwapDataLayout.span);
    exports.InitSwapDataLayout.encode({
        instruction: instruction_1.SwapInstruction.InitSwap,
        owner: owner,
        rateNumberator: rateNumberator,
        rateDenominator: rateDenominator
    }, data);
    ///   0. `[writable]` Swap account - uninitialized.
    ///   1. `[]` Rent sysvar.
    ///   2. `[]` Token program id.
    ///   3. `[]` Derived swap authority.
    ///   4. `[]` token a mint.
    ///   5. `[writable]` token a reserve.
    ///   6. `[]` token b mint.
    ///   7. `[writable]` token b reserve.
    var keys = [
        { pubkey: swapPub, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: swapAuthority, isSigner: false, isWritable: false },
        { pubkey: tokenAMint, isSigner: false, isWritable: false },
        { pubkey: tokenAReserve, isSigner: false, isWritable: true },
        { pubkey: tokenBMint, isSigner: false, isWritable: false },
        { pubkey: tokenBReserve, isSigner: false, isWritable: true },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: programId,
        data: data
    });
};
exports.DepositDataLayout = buffer_layout_1.struct([
    buffer_layout_1.u8('instruction'),
    util_1.u64('moveAmount'),
    util_1.u64('wsolAmount')
]);
exports.depositInstruction = function (programId, owner, moveAmount, wsolAmount, swapPub, moveOwnerATA, moveReservePDA, wsolOwnerATA, wsolReservePDA) {
    var data = Buffer.alloc(exports.DepositDataLayout.span);
    exports.DepositDataLayout.encode({
        instruction: instruction_1.SwapInstruction.Deposit,
        moveAmount: moveAmount,
        wsolAmount: wsolAmount
    }, data);
    ///   0. `[writable]` swap account.
    ///   1. `[]` Token program id.
    ///   2. `[signer]` User transfer authority.
    ///   3. `[writable]` src token a account (user_account).
    ///   4. `[writable]` dest token a reserve.
    ///   5. `[writable]` src token b account (user_account).
    ///   6. `[writable]` dest token b reserve.
    var keys = [
        { pubkey: swapPub, isSigner: false, isWritable: true },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: moveOwnerATA, isSigner: false, isWritable: true },
        { pubkey: moveReservePDA, isSigner: false, isWritable: true },
        { pubkey: wsolOwnerATA, isSigner: false, isWritable: true },
        { pubkey: wsolReservePDA, isSigner: false, isWritable: true },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: programId,
        data: data
    });
};
exports.SwapDataLayout = buffer_layout_1.struct([
    buffer_layout_1.u8('instruction'),
    util_1.u64('amount')
]);
exports.swapInstruction = function (programId, owner, amount, swapPub, swapAuthority, srcFromOwnerATA, dstFromReservePDA, srcToReservePDA, dstToOwnerATA) {
    var data = Buffer.alloc(exports.SwapDataLayout.span);
    exports.SwapDataLayout.encode({
        instruction: instruction_1.SwapInstruction.Swap,
        amount: amount
    }, data);
    ///   0. `[writable]` swap account.
    ///   1. `[]` Token program id.
    ///   2. `[signer]` User transfer authority.
    ///   3. `[]` Swap authority.
    ///   4. `[writable]` src token `from` account (user_account).
    ///   5. `[writable]` dest token `from` reserve.
    ///   6. `[writable]` src token `to` reserve.
    ///   7. `[writable]` dest token `to` account (user_account).
    var keys = [
        { pubkey: swapPub, isSigner: false, isWritable: true },
        { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: swapAuthority, isSigner: false, isWritable: false },
        { pubkey: srcFromOwnerATA, isSigner: false, isWritable: true },
        { pubkey: dstFromReservePDA, isSigner: false, isWritable: true },
        { pubkey: srcToReservePDA, isSigner: false, isWritable: true },
        { pubkey: dstToOwnerATA, isSigner: false, isWritable: true },
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: programId,
        data: data
    });
};
//# sourceMappingURL=swap.js.map