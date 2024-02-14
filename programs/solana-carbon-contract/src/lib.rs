use anchor_lang::prelude::*;
use std::mem::size_of;
// use std::{str::FromStr};

declare_id!("EEETpgqxVBBW7MgmhXU1iH763C2xBpBV7VmnLxjFx2Ga");

#[program]
pub mod solana_carbon_contract {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, init_data: InitConfigData) -> Result<()> {
        // Extract user_id from the passed instruction data
        let user_id = init_data.owner;
        // Generate the PDA using the CARBON_CONFIG seed and user_id
        let seeds = &[CARBON_CONFIG, user_id.as_ref()];
        let bump = Pubkey::find_program_address(seeds, ctx.program_id).1;
        // Initialize the config account
        let config_account = &mut ctx.accounts.config;
        config_account.authority = ctx.accounts.authority.key();
        // config_account.authorised = authorised_id.into();
        config_account.bump = bump; // Use the dynamically generated bump

        Ok(())
    }

    pub fn init_authorised(ctx: Context<InitAuth>, init_data:InitAuthData) -> Result<()> {
        // Extract authorised_id from the passed instruction data
        let authorised_id = init_data.authorised;
        let id = init_data.id;
        // Generate the PDA using the CARBON_AUTHORISED seed and user_id
        let authorised_seeds = &[CARBON_AUTHORISED, id.as_ref()];
        let authorised_bump = Pubkey::find_program_address(authorised_seeds, ctx.program_id).1;
        // Initialize the authorised account
        let carbon_delegate = &mut ctx.accounts.carbon_auth;
        carbon_delegate.authority = authorised_id.into();
        carbon_delegate.bump = authorised_bump; // Use the dynamically generated bump
    
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfig>, update_data: UpdateConfigData) -> Result<()> {
        ctx.accounts.config.authority = ctx.accounts.new_authority.key();
        Ok(())
    }


    pub fn withdraw(ctx: Context<WithdrawAuthorised>, id:String) -> Result<()> {
        require!(ctx.accounts.delegate_pda.lamports() > 0, CarbonError::InsuffucientFund);
		let rent_exempt_balance = ctx.accounts.rent.minimum_balance(ctx.accounts.delegate_pda.data_len());
		
		// Ensure that delegate_pda has more than the rent-exempt balance.
		require!(ctx.accounts.delegate_pda.lamports() > rent_exempt_balance, CarbonError::InsuffucientFund);
	
		// Calculate the amount that can be safely withdrawn without going below the rent-exempt balance.
		let withdrawable_amount = ctx.accounts.delegate_pda.lamports() - rent_exempt_balance;
        let seeds = &[CARBON_DELEGATE];
        let (_delegate_pda_key, bump) = Pubkey::find_program_address(seeds, &crate::ID);

        let signer_seeds = &[
            CARBON_DELEGATE,
            &[bump],
        ];
        let signer = &[&signer_seeds[..]];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(ctx.accounts.delegate_pda.key, ctx.accounts.authority.key, withdrawable_amount),
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
#[instruction(init_data:InitAuthData)]
pub struct InitAuth<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Include the existing Config account to verify its authority
    #[account(
        seeds = [CARBON_CONFIG],
        bump,
        constraint = config.authority == authority.key() @ CarbonError::InvalidAuthority,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        seeds = [CARBON_AUTHORISED, init_data.id.as_ref()], // dynamic seed based on unique_id
        bump,
        payer = authority,
        space = 8 + std::mem::size_of::<Config>(), // Adjusted space calculation
    )]
    pub carbon_auth: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitConfigData {
    pub owner: [u8; 32], // Adjust the size as needed
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitAuthData {
    pub authorised: [u8; 32],
    pub id: String // Adjust the size as needed
}


#[derive(Accounts)]
#[instruction()]
pub struct UpdateConfig<'info> {
    #[account(mut,)]
    pub authority: Signer<'info>,

    #[account()]
    /// CHECK: we read this key only
    pub new_authority: Signer<'info>,

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

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateConfigData {
    pub user_id: [u8; 32], // Adjust the size as needed
}


#[derive(Accounts)]
#[instruction(id:String)]
pub struct WithdrawAuthorised<'info> {
    #[account(mut)]
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
        seeds = [CARBON_AUTHORISED,id.as_ref()],
        bump,
        // constraint = carbon_auth.authority == authority.key() @ CarbonError::InvalidAuthority,
    )]
    pub carbon_auth: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
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
pub const CARBON_AUTHORISED: &[u8] = b"CARBON_AUTHORISED";
