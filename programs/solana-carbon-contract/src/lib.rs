use anchor_lang::prelude::*;
// use std::{str::FromStr};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_carbon_contract {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        ctx.accounts.config.authority = ctx.accounts.authority.key();
        ctx.accounts.config.bump = *ctx.bumps.get("config").unwrap();
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfig>) -> Result<()> {
        ctx.accounts.config.authority = ctx.accounts.new_authority.key();
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        require!(ctx.accounts.delegate_pda.lamports() > 0, CarbonError::InsuffucientFund);
        // require!(ctx.accounts.authority.key() == Pubkey::from_str(ADMIN_AUTHORITY).unwrap(), CarbonError::InvalidAuthority);
        let seeds = &[CARBON_DELEGATE];
        let (_delegate_pda_key, bump) = Pubkey::find_program_address(seeds, &crate::ID);

        let signer_seeds = &[
            CARBON_DELEGATE,
            &[bump],
        ];
        let signer = &[&signer_seeds[..]];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(ctx.accounts.delegate_pda.key, ctx.accounts.authority.key, ctx.accounts.delegate_pda.lamports()),
            &[
                ctx.accounts.delegate_pda.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct InitConfig<'info> {
    #[account(mut,)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [CARBON_CONFIG],
        bump,
        payer = authority,
        space = std::mem::size_of::<Config>() + 8,
    )]
    pub config: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction()]
pub struct UpdateConfig<'info> {
    #[account(mut,)]
    pub authority: Signer<'info>,

    #[account()]
    /// CHECK: we read this key only
    pub new_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [CARBON_CONFIG],
        bump,
        constraint = config.authority == authority.key() @ CarbonError::InvalidAuthority,
    )]
    pub config: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction()]
pub struct Withdraw<'info> {
    #[account(mut,)]
    pub authority: Signer<'info>,
    
    /// CHECK: we read this key only
    #[account(
        mut,
        seeds = [CARBON_DELEGATE],
        bump,
    )]
    pub delegate_pda: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [CARBON_CONFIG],
        bump,
        constraint = config.authority == authority.key() @ CarbonError::InvalidAuthority,
    )]
    pub config: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub reserved: [u128; 10],
}

#[error_code]
pub enum CarbonError {
    #[msg("Invalid Authority.")]
    InvalidAuthority,

    #[msg("Insuffucient Fund.")]
    InsuffucientFund,
}

pub const CARBON_CONFIG: &[u8] = b"CARBON_CONFIG";
pub const CARBON_DELEGATE: &[u8] = b"CARBON_DELEGATE";
// pub const ADMIN_AUTHORITY: &str = "";