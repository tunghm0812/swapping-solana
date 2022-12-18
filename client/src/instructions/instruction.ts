/** @internal */

export enum TokenInstruction {
  InitMint = 0,
  InitializeAccount = 1,
  Transfer = 3,
  MintTo = 7,
  CloseAccount = 9,
  SyncNative = 17
}

export enum SwapInstruction {
  InitSwap = 0,
  Deposit = 1,
  Swap = 2
}
