use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod escrow_vault {
    use super::*;

    /// Called once to create the global vault PDA.
    /// Saves the admin and treasury pubkeys for future authorization.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.admin_pubkey = ctx.accounts.admin.key();
        vault_state.treasury_pubkey = ctx.accounts.treasury.key();
        vault_state.bump = ctx.bumps.vault_state;
        Ok(())
    }

    /// Pays out SOL from the vault to one or more winners.
    ///
    /// - `total_pot_amount`: total lamports in the pot for this game.
    /// - Winners are passed via `remaining_accounts` (all must be mutable).
    /// - 2% of the pot goes to the treasury.
    /// - 98% of the pot is split equally among all winners.
    pub fn payout_sol(ctx: Context<PayoutSol>, total_pot_amount: u64) -> Result<()> {
        let vault_state = &ctx.accounts.vault_state;

        // 1. Ensure the signer is the admin
        require!(
            ctx.accounts.admin.key() == vault_state.admin_pubkey,
            VaultError::UnauthorizedAdmin
        );

        // 2. Ensure the treasury matches the one set during initialization
        require!(
            ctx.accounts.treasury.key() == vault_state.treasury_pubkey,
            VaultError::InvalidTreasury
        );

        // 3. Get winner accounts from remaining_accounts
        let winners = &ctx.remaining_accounts;
        let winner_count = winners.len() as u64;

        require!(winner_count > 0, VaultError::NoWinners);

        // 4. Calculate fees safely (2% to treasury, 98% split among winners)
        let treasury_amount = total_pot_amount
            .checked_mul(2)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(100)
            .ok_or(VaultError::MathOverflow)?;

        let winner_pool = total_pot_amount
            .checked_sub(treasury_amount)
            .ok_or(VaultError::MathOverflow)?;

        let amount_per_winner = winner_pool
            .checked_div(winner_count)
            .ok_or(VaultError::MathOverflow)?;

        // Handle dust (remainder from integer division) — give it to the first winner
        let remainder = winner_pool
            .checked_sub(
                amount_per_winner
                    .checked_mul(winner_count)
                    .ok_or(VaultError::MathOverflow)?,
            )
            .ok_or(VaultError::MathOverflow)?;

        // 5. Ensure vault has enough SOL to cover the payout
        let vault_lamports = ctx.accounts.vault_state.to_account_info().lamports();
        let rent_exemption = Rent::get()?.minimum_balance(VaultState::SPACE);

        let available_balance = vault_lamports
            .checked_sub(rent_exemption)
            .unwrap_or(0);

        require!(
            available_balance >= total_pot_amount,
            VaultError::InsufficientFunds
        );

        // 6. Deduct total pot from vault
        **ctx.accounts.vault_state.to_account_info().try_borrow_mut_lamports()? -= total_pot_amount;

        // 7. Pay the treasury
        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? += treasury_amount;

        // 8. Pay each winner their equal share
        for (i, winner) in winners.iter().enumerate() {
            require!(winner.is_writable, VaultError::WinnerNotWritable);

            let payout = if i == 0 {
                // First winner gets the dust remainder
                amount_per_winner
                    .checked_add(remainder)
                    .ok_or(VaultError::MathOverflow)?
            } else {
                amount_per_winner
            };

            **winner.try_borrow_mut_lamports()? += payout;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = admin,
        space = VaultState::SPACE,
        seeds = [b"global_vault"],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: We only save this pubkey; no data read/write required here.
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayoutSol<'info> {
    #[account(
        mut,
        seeds = [b"global_vault"],
        bump = vault_state.bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    pub admin: Signer<'info>,

    #[account(mut)]
    /// CHECK: We manually verify this matches `vault_state.treasury_pubkey`
    pub treasury: AccountInfo<'info>,

    // Winners are passed via ctx.remaining_accounts (dynamic array)
}

#[account]
pub struct VaultState {
    pub admin_pubkey: Pubkey,   // 32 bytes
    pub treasury_pubkey: Pubkey, // 32 bytes
    pub bump: u8,                // 1 byte
}

impl VaultState {
    pub const SPACE: usize = 8 + 32 + 32 + 1; // discriminator + fields
}

#[error_code]
pub enum VaultError {
    #[msg("You are not authorized to perform this action.")]
    UnauthorizedAdmin,
    #[msg("The provided treasury does not match the vault state.")]
    InvalidTreasury,
    #[msg("Mathematical overflow or underflow occurred.")]
    MathOverflow,
    #[msg("Insufficient funds in the vault to cover the total pot amount.")]
    InsufficientFunds,
    #[msg("At least one winner account must be provided.")]
    NoWinners,
    #[msg("All winner accounts must be marked as writable.")]
    WinnerNotWritable,
}
