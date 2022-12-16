// #![deny(missing_docs)]

pub mod entrypoint;
pub mod processor;
pub mod error;
pub mod instruction;
pub mod state;


// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;
solana_program::declare_id!("SwapsVeCiPHMUAtzQWZw7RjsKjgCjhwU55QGu4U1Szw");
