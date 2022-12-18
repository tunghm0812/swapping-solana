# swapping-solana
## 1. Source stucture:
```
|_client    // folder contains swap client
|_program   // folder contains swap program
```
## 2. Swap Program
### Requirements
```
    solana-cli ^1.14.10
    rustup ^1.25.1
```
### Build swap program
```
    cd ./program
    sudo cargo build-bpf
```
### Test swap program
```
    sudo cargo test-bpf
```

## 3. Swap Client
### Requirements
```
    node v14.20.0
```

### Build swap client
```
    cd ./client
    npm install
    npm run build
```

### Run swap Client
```
    npm run swap <<from_token_symbol>> <<to_token_symbol>> <<amount>>
```

### Note: token_symbol only "move" and "sol"
E.g:
```
    npm run swap move sol 4000   // swap 4000 move to sol.

    npm run swap sol move 300 // swap 300 sol to move.
```

Output
```
    Connection to: https://api.testnet.solana.com
    Swap program id: FtemqETZDWoEH7NM94HX8BYDEQmBcvJkKrRYZYXxQhhi
    ================================================================
    Swap Info:
    + MOVE balance: 10000028200n
    + SOL balance: 999997180n
    + Price: 10  MOVE/SOL (same decimals)
    ================================================================
    Your balance before swap:
    + MOVE balance: 90099971800n
    + SOL balance: 2786083100
    ================================================================
    Swap 4000 move to sol.
    Detail: https://explorer.solana.com/tx/5sfjgF3CvXkeWj7NN9JjpgyumQ1QBnfF2EWowPjyNJzTvo4fsC7KmBYQwDT1fbNVVPUmbdEdgSHVM7Av7WcZWFBY?cluster=testnet
    ================================================================
    Your balance changed after swap (tx fee = 5000 lamports):
    + MOVE balance changed: -4000n
    + SOL balance changed: -4600
```
