"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSigners = exports.createCloseAccountInstruction = exports.closeAccountInstructionData = exports.createSyncNativeInstruction = exports.syncNativeInstructionData = exports.transferInstruction = exports.mintToInstruction = exports.createAssociatedTokenAccountInstruction = exports.initSPLTokenAccountInstruction = exports.initMintInstruction = void 0;
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var buffer_layout_1 = require("buffer-layout");
var util_1 = require("../util");
var instruction_1 = require("./instruction");
var InitMintDataLayout = buffer_layout_1.struct([
    buffer_layout_1.u8('instruction'),
    buffer_layout_1.u8('decimals'),
    util_1.publicKey('mintAuthority'),
    buffer_layout_1.u8('option'),
    util_1.publicKey('freezeAuthority')
]);
/**
 * Construct an InitializeMint instruction
 *
 * @param programId SPL Token program account
 * @param mint Token mint account
 * @param decimals Number of decimals in token account amounts
 * @param mintAuthority Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 */
exports.initMintInstruction = function (mint, decimals, mintAuthority, freezeAuthority) {
    var data = Buffer.alloc(InitMintDataLayout.span);
    InitMintDataLayout.encode({
        instruction: instruction_1.TokenInstruction.InitMint,
        decimals: decimals,
        mintAuthority: mintAuthority,
        option: freezeAuthority === null ? 0 : 1,
        freezeAuthority: freezeAuthority
    }, data);
    var keys = [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: spl_token_1.TOKEN_PROGRAM_ID,
        data: data
    });
};
var InitSPLTokenAccountDataLayout = buffer_layout_1.struct([buffer_layout_1.u8('instruction')]);
exports.initSPLTokenAccountInstruction = function (mint, account, owner) {
    var data = Buffer.alloc(InitSPLTokenAccountDataLayout.span);
    InitSPLTokenAccountDataLayout.encode({
        instruction: instruction_1.TokenInstruction.InitializeAccount
    }, data);
    var keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: spl_token_1.TOKEN_PROGRAM_ID,
        data: data
    });
};
/**
 * Construct the AssociatedTokenProgram instruction to create the associated
 * token account
 *
 * @param associatedProgramId SPL Associated Token program account
 * @param programId SPL Token program account
 * @param mint Token mint account
 * @param associatedAccount New associated account
 * @param owner Owner of the new account
 * @param payer Payer of fees
 */
exports.createAssociatedTokenAccountInstruction = function (programId, mint, associatedAccount, owner, payer) {
    var data = Buffer.alloc(0);
    var keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedAccount, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ];
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
        data: data
    });
};
var MintToDataLayout = buffer_layout_1.struct([buffer_layout_1.u8('instruction'), util_1.u64('amount')]);
/**
 * Construct a MintTo instruction
 *
 * @param mint Public key of the mint
 * @param dest Public key of the account to mint to
 * @param authority The mint authority
 * @param multiSigners Signing accounts if `authority` is a multiSig
 * @param amount Amount to mint
 */
exports.mintToInstruction = function (mint, dest, authority, multiSigners, amount) {
    var data = Buffer.alloc(MintToDataLayout.span);
    MintToDataLayout.encode({
        instruction: instruction_1.TokenInstruction.MintTo,
        amount: BigInt(amount)
    }, data);
    var keys = [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: dest, isSigner: false, isWritable: true }
    ];
    if (multiSigners.length === 0) {
        keys.push({
            pubkey: authority,
            isSigner: true,
            isWritable: false
        });
    }
    else {
        keys.push({ pubkey: authority, isSigner: false, isWritable: false });
        multiSigners.forEach(function (signer) {
            return keys.push({
                pubkey: signer.publicKey,
                isSigner: true,
                isWritable: false
            });
        });
    }
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: spl_token_1.TOKEN_PROGRAM_ID,
        data: data
    });
};
/**
 * Construct a Transfer instruction
 *
 * @param programId SPL Token program account
 * @param source Source account
 * @param destination Destination account
 * @param owner Owner of the source account
 * @param multiSigners Signing accounts if `authority` is a multiSig
 * @param amount Number of tokens to transfer
 */
exports.transferInstruction = function (source, destination, owner, multiSigners, amount) {
    var dataLayout = buffer_layout_1.struct([buffer_layout_1.u8('instruction'), util_1.u64('amount')]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: instruction_1.TokenInstruction.Transfer,
        amount: BigInt(amount)
    }, data);
    var keys = [
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true }
    ];
    if (multiSigners.length === 0) {
        keys.push({
            pubkey: owner,
            isSigner: true,
            isWritable: false
        });
    }
    else {
        keys.push({ pubkey: owner, isSigner: false, isWritable: false });
        multiSigners.forEach(function (signer) {
            return keys.push({
                pubkey: signer.publicKey,
                isSigner: true,
                isWritable: false
            });
        });
    }
    return new web3_js_1.TransactionInstruction({
        keys: keys,
        programId: spl_token_1.TOKEN_PROGRAM_ID,
        data: data
    });
};
exports.syncNativeInstructionData = buffer_layout_1.struct([buffer_layout_1.u8('instruction')]);
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createSyncNativeInstruction(account, programId) {
    if (programId === void 0) { programId = spl_token_1.TOKEN_PROGRAM_ID; }
    var keys = [{ pubkey: account, isSigner: false, isWritable: true }];
    var data = Buffer.alloc(exports.syncNativeInstructionData.span);
    exports.syncNativeInstructionData.encode({ instruction: instruction_1.TokenInstruction.SyncNative }, data);
    return new web3_js_1.TransactionInstruction({ keys: keys, programId: programId, data: data });
}
exports.createSyncNativeInstruction = createSyncNativeInstruction;
exports.closeAccountInstructionData = buffer_layout_1.struct([buffer_layout_1.u8('instruction')]);
/**
 * Construct a CloseAccount instruction
 *
 * @param account      Account to close
 * @param destination  Account to receive the remaining balance of the closed account
 * @param authority    Account close authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createCloseAccountInstruction(account, destination, authority, multiSigners, programId) {
    if (multiSigners === void 0) { multiSigners = []; }
    if (programId === void 0) { programId = spl_token_1.TOKEN_PROGRAM_ID; }
    var keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], authority, multiSigners);
    var data = Buffer.alloc(exports.closeAccountInstructionData.span);
    exports.closeAccountInstructionData.encode({ instruction: instruction_1.TokenInstruction.CloseAccount }, data);
    return new web3_js_1.TransactionInstruction({ keys: keys, programId: programId, data: data });
}
exports.createCloseAccountInstruction = createCloseAccountInstruction;
function addSigners(keys, ownerOrAuthority, multiSigners) {
    if (multiSigners.length) {
        keys.push({ pubkey: ownerOrAuthority, isSigner: false, isWritable: false });
        for (var _i = 0, multiSigners_1 = multiSigners; _i < multiSigners_1.length; _i++) {
            var signer = multiSigners_1[_i];
            keys.push({ pubkey: signer.publicKey, isSigner: true, isWritable: false });
        }
    }
    else {
        keys.push({ pubkey: ownerOrAuthority, isSigner: true, isWritable: false });
    }
    return keys;
}
exports.addSigners = addSigners;
//# sourceMappingURL=SPLToken.js.map