import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from '@solana/web3.js';
// import { SolanaCarbonContract } from '../target/types/solana_carbon_contract';
import fs from 'fs';
import * as assert from 'assert';

async function getBalance(publicKey: PublicKey, provider: anchor.AnchorProvider): Promise<number> {
	return await provider.connection.getBalance(publicKey);
}


describe('Solana Carbon Contract', () => {
	anchor.setProvider(anchor.AnchorProvider.env());

  it('Should update the config', async () => {

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);   

    const program = anchor.workspace.SolanaCarbonContract;
    const payer = program.provider.wallet.payer;

    // Initialize the config account
    const configKeypair = Keypair.generate();
    const [configPda, configBump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_CONFIG"))],
      program.programId
    );

    // console.log("payer isss: ", payer.publicKey)
    // console.log("configPda is :", configPda)
    // console.log(program.programId)
    // console.log(SystemProgram.programId)

    // Example user_id as a 32-byte array
    const userId = new anchor.web3.PublicKey(payer.publicKey).toBytes();
    const tx = await program.rpc.initConfig(
      {
        userId, // Pass the user_id as part of the instruction data
      },{
      accounts: {
        authority: payer.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [payer],
    });

    // Confirm the transaction.
    await program.provider.connection.confirmTransaction(tx, 'confirmed');

    // New authority
    const newAuthority = Keypair.generate();
    console.log(newAuthority.publicKey)

    // Check the signer's balance before withdrawal
    const initialSignerBalance = await getBalance(newAuthority.publicKey, provider);
    console.log("Initial newAuthority Balance:", initialSignerBalance);

    // Send SOL to delegate_pda
    const lamportsToSend = 1000000; // Number of lamports to send (1 SOL = 1,000,000 lamports)
    const transferTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: newAuthority.publicKey,
        lamports: lamportsToSend,
      })
    );
    // Sign and send the transaction
    await provider.sendAndConfirm(transferTx, [payer]);

      // Check the signer's balance before withdrawal
      const afterSignerBalance = await getBalance(newAuthority.publicKey, provider);
      console.log("AfterPay newAuthority Balance:", afterSignerBalance);

    // Update the config
    const updateTx = await program.rpc.updateConfig(      {
      userId, // Pass the user_id as part of the instruction data
      },{
      accounts: {
        authority: payer.publicKey,
        newAuthority: newAuthority.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [payer, newAuthority],
    });

    await program.provider.connection.confirmTransaction(updateTx, 'confirmed');

    // // Fetch the updated config account
    const updatedConfig = await program.account.config.fetch(configPda);

    // Assert the new authority
    assert.equal(updatedConfig.authority.toString(), newAuthority.publicKey.toString());

  });
  });


// it('Should send SOL to the delegate_pda and withdraw', async () => {
//   const program = anchor.workspace.SolanaCarbonContract;
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);  
//   const payer = program.provider.wallet.payer;

//   const [configPda, configBump] = await PublicKey.findProgramAddress(
//     [Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_CONFIG"))],
//     program.programId
//   );

//   const owner = new anchor.web3.PublicKey(payer.publicKey).toBytes();
//   const tx_Owner_config = await program.rpc.initConfig(
//     {
//       owner, // Pass the user_id as part of the instruction data
//     },{
//     accounts: {
//       authority: payer.publicKey,
//       config: configPda,
//       systemProgram: SystemProgram.programId,
//       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//     },
//     signers: [payer],
//   });
//     // Confirm the transaction.
//   await program.provider.connection.confirmTransaction(tx_Owner_config, 'confirmed');


//   let id = "1";
//   const [authPda, authBump] = await PublicKey.findProgramAddress(
//     [Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_AUTHORISED"+id))],
//     program.programId
//   );

//   let authorised1 = new anchor.web3.PublicKey(payer.publicKey);
//   // console.log("This is the authrosied1", authorised1)


//   const tx_auth_1 = await program.rpc.initAuthorised(
//     {
//       authorised1,
//       id
//     },
//     {
//     accounts: {
//       authority: payer.publicKey,
//       config:configPda,
//       carbonAuth: authPda,
//       systemProgram: SystemProgram.programId,
//       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//     },
//     signers: [payer],
//   });

//       // Confirm the transaction.
//     await program.provider.connection.confirmTransaction(tx_auth_1, 'confirmed');
	
	
//     id = "12";
//     const [authPda2, authBump2] = await PublicKey.findProgramAddress(
//       [Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_AUTHORISED"+id))],
//       program.programId
//     );

//     const newAccount = Keypair.generate();
//     // console.log(newAccount.publicKey)
//     let authorised2 = newAccount.publicKey.toBytes();
//     // console.log("This is the authrosied22222", authorised2)

//     const tx_auth_2 = await program.rpc.initAuthorised(
//       {
//         authorised2,
//         id  
//       },
//       {
//       accounts: {
//         authority: payer.publicKey,
//         config:configPda,
//         carbonAuth: authPda2,
//         systemProgram: SystemProgram.programId,
//         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//       },
//       signers: [payer],
//     });
	
//   // Confirm the transaction.
//   await program.provider.connection.confirmTransaction(tx_auth_2, 'confirmed');
	

//   // Derive the delegate_pda address
//   const [delegatePda, delegateBump] = await PublicKey.findProgramAddress(
//     [Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_DELEGATE"))],
//     program.programId
//   );

//   // Check the signer's and delegate account balance before withdrawal
//   const initialSignerBalance = await getBalance(payer.publicKey, provider);
//   console.log("Initial Payer Balance:", initialSignerBalance);
//   const initialDelegateBalance = await getBalance(delegatePda, provider);
//   console.log("Initial Delegate Balance:", initialDelegateBalance);
//   const initialNewAccountBalance = await getBalance(newAccount.publicKey, provider);
//   console.log("Initial New Account Balance:", initialNewAccountBalance);
//   ////////////////////////////////////

//   // Send SOL to delegate_pda
//   const lamportsToSend = 1000000000; // Number of lamports to send (1 SOL = 1,000,000 lamports)
//   const transferTx = new anchor.web3.Transaction().add(
//     anchor.web3.SystemProgram.transfer({
//       fromPubkey: payer.publicKey,
//       toPubkey: delegatePda,
//       lamports: lamportsToSend,
//     })
//   );
//   await provider.sendAndConfirm(transferTx, [payer]);

//   const lamportsToSendNew = 1000000000; // Number of lamports to send (1 SOL = 1,000,000 lamports)
//   const transferTxNew = new anchor.web3.Transaction().add(
//     anchor.web3.SystemProgram.transfer({
//       fromPubkey: payer.publicKey,
//       toPubkey: newAccount.publicKey,
//       lamports: lamportsToSendNew,
//     })
//   );
//   // Sign and send the transaction
//   await provider.sendAndConfirm(transferTxNew, [payer]);

//     // Check the signer's and delegate balance after paying the delegate
//     const afterSignerBalance = await getBalance(payer.publicKey, provider);
//     console.log("AfterPay signer Balance:", afterSignerBalance);
//     const afterDelegateBalance = await getBalance(delegatePda, provider);
//     console.log("AfterPay Delegate Balance:", afterDelegateBalance);
//     const afterNewAccountBalance = await getBalance(newAccount.publicKey, provider);
//     console.log("AfterPay New account Balance:", afterNewAccountBalance);
//     ///////////////////////////////////

//     id ="12"
//     let authorised = new anchor.web3.PublicKey(payer.publicKey);
//     // console.log("==================== all arguments for withdraw");
//     // console.log("authorised1:", authorised1);
//     // console.log("id:", id);
//     // console.log("authority:", payer.publicKey);
//     // console.log("delegatePda:", delegatePda);
//     // console.log("carbonAuth:", authPda);
//     // console.log("===============================================");
//   // Withdraw SOL from delegate_pda
//   const withdrawTx = await program.rpc.withdraw(
//     id  
//     ,{
//     accounts: {
//       authority: newAccount.publicKey,
//       delegatePda: delegatePda,
//       carbonAuth: authPda2, // Make sure this is the correct config PDA
//       systemProgram: SystemProgram.programId,
//       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//     },
//     signers: [newAccount],
//   });
//     // Confirm the transaction.
//   await program.provider.connection.confirmTransaction(withdrawTx, 'confirmed');

//     // Check the signer's and delegate balance after paying the delegate
//     const afterWithSignerBalance = await getBalance(payer.publicKey, provider);
//     console.log("After withdraw signer Balance:", afterWithSignerBalance);
//     const afterWithDelegateBalance = await getBalance(delegatePda, provider);
//     console.log("After withdraw Delegate Balance:", afterWithDelegateBalance);
//     const afterWithNewAccountBalance = await getBalance(newAccount.publicKey, provider);
//     console.log("After withdraw  New account Balance:", afterWithNewAccountBalance);
//     ///////////////////////////////////

// });

// it('Should not update the config with one signer', async () => {
	
// 	const provider = anchor.AnchorProvider.env();
// 	anchor.setProvider(provider); 
// 	const program = anchor.workspace.SolanaCarbonContract;
// 	const payer = program.provider.wallet.payer;  

// 	// Initialize the config account
// 	const configKeypair = Keypair.generate();
// 	const [configPda, configBump] = await PublicKey.findProgramAddress(
// 		[Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_CONFIG"))],
// 		program.programId
// 	);
// 	// New authority
// 	const newAuthority = Keypair.generate();

// 	// Flag to check if the expected error occurred
// 	let didThrowExpectedError = false;
	
// 	try {
// 		const adminId = new anchor.web3.PublicKey(payer.publicKey).toBytes();
// 		const tx = await program.rpc.initConfig(
// 			{
// 				adminId, // Pass the user_id as part of the instruction data
// 			},{
// 			accounts: {
// 				authority: payer.publicKey,
// 				config: configPda,
// 				systemProgram: SystemProgram.programId,
// 				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
// 			},
// 			signers: [payer],
// 		});
// 		const userId = newAuthority.publicKey.toBytes();
// 	// Attempt to update the config with only the newAuthority as signer
// 	const updateTx = await program.rpc.updateConfig({
// 			userId, // Pass the user_id as part of the instruction data
// 			},{
// 			accounts: {
// 				authority: payer.publicKey,
// 				newAuthority: newAuthority.publicKey,
// 				config: configPda,
// 				systemProgram: SystemProgram.programId,
// 				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
// 			},
// 			signers: [payer],
// 		});
// 		// If the above line does not throw an error, then explicitly fail the test
// 	} catch (error) {
// 			// Check if the error is the expected "InvalidAuthority" error
// 			if (error.message.includes("InvalidAuthority")|| error.message.includes("Signature verification failed")) {
// 				didThrowExpectedError = true;
// 			} else {
// 				// If the error is not what we expected, rethrow it to fail the test with the actual error message
// 				throw error;
// 			}
// 	}
// })


// it('Should not withdraw the money to none assigned accounts due to AccountNotInitialized error', async () => {
	
// 	const provider = anchor.AnchorProvider.env();
// 	anchor.setProvider(provider); 
// 	const program = anchor.workspace.SolanaCarbonContract;
// 	const payer = program.provider.wallet.payer;  

// 	// New authority
// 	const notAuthorised = Keypair.generate();

// 	// Flag to check if the expected error occurred
// 	let didThrowExpectedError = false;
	
// 	try {

// 		// Derive the delegate_pda address
// 		const [delegatePda, delegateBump] = await PublicKey.findProgramAddress(
// 			[Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_DELEGATE"))],
// 			program.programId
// 		);

// 		// Send SOL to delegate_pda
// 		const lamportsToSend = 1000000000; // Number of lamports to send (1 SOL = 1,000,000 lamports)
// 		const transferTx = new anchor.web3.Transaction().add(
// 			anchor.web3.SystemProgram.transfer({
// 			fromPubkey: payer.publicKey,
// 			toPubkey: delegatePda,
// 			lamports: lamportsToSend,
// 			})
// 		);
// 		await provider.sendAndConfirm(transferTx, [payer]);
			
// 		let id = "12";
// 		const [authPda2, authBump2] = await PublicKey.findProgramAddress(
// 			[Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_AUTHORISED"+id))],
// 			program.programId
// 		);

// 		// Withdraw SOL by nont-authorised party from delegate_pda
// 		const withdrawTx = await program.rpc.withdraw(
// 			id  
// 			,{
// 			accounts: {
// 			authority: notAuthorised.publicKey,
// 			delegatePda: delegatePda,
// 			carbonAuth: authPda2, // Make sure this is the correct config PDA
// 			systemProgram: SystemProgram.programId,
// 			rent: anchor.web3.SYSVAR_RENT_PUBKEY,
// 			},
// 			signers: [notAuthorised],
// 		});

// 	} catch (error) {
// 			// Check if the error is the expected "InvalidAuthority" error
// 			if (error.message.includes("AccountNotInitialized")|| error.message.includes("The program expected this account to be already initialized.")) {
// 				didThrowExpectedError = true;
// 			} else {
// 				// If the error is not what we expected, rethrow it to fail the test with the actual error message
// 				throw error;
// 			}
// 	}
// })

it('Should not withdraw the money to a revoked account', async () => {
	
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider); 
	const program = anchor.workspace.SolanaCarbonContract;
	const payer = program.provider.wallet.payer;  

	// New authority
	const notAuthorised = Keypair.generate();

	// Flag to check if the expected error occurred
	let didThrowExpectedError = false;
	
	try {

		// Derive the delegate_pda address
		const [delegatePda, delegateBump] = await PublicKey.findProgramAddress(
			[Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_DELEGATE"))],
			program.programId
		);

		const [configPda, configBump] = await PublicKey.findProgramAddress(
			[Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_CONFIG"))],
			program.programId
		);

		// Send SOL to delegate_pda
		const lamportsToSend = 1000000000; // Number of lamports to send (1 SOL = 1,000,000 lamports)
		const transferTx = new anchor.web3.Transaction().add(
			anchor.web3.SystemProgram.transfer({
			fromPubkey: payer.publicKey,
			toPubkey: delegatePda,
			lamports: lamportsToSend,
			})
		);
		await provider.sendAndConfirm(transferTx, [payer]);

		//First assigning the not-authorised party and it should be able to withdraw
		let id = "12";
		const [authPda2, authBump2] = await PublicKey.findProgramAddress(
			[Buffer.from(anchor.utils.bytes.utf8.encode("CARBON_AUTHORISED"+id))],
			program.programId
		);

		const tx_auth_2 = await program.rpc.initAuthorised(
			{
				notAuthorised,
				id  
			},
			{
			accounts: {
				authority: payer.publicKey,
				config:configPda,
				carbonAuth: authPda2,
				systemProgram: SystemProgram.programId,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			},
			signers: [payer],
			});
	
		// Confirm the transaction.
		await program.provider.connection.confirmTransaction(tx_auth_2, 'confirmed');

		// Revoking the not-authorised party with setting a null address to that id
		const tx_auth_3 = await program.rpc.initAuthorised(
			{
				payer,
				id  
			},
			{
			accounts: {
				authority: payer.publicKey,
				config:configPda,
				carbonAuth: authPda2,
				systemProgram: SystemProgram.programId,
				rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			},
			signers: [payer],
			});

		// Withdraw SOL by nont-authorised party from delegate_pda
		// Should raise error because we already revoke this party 
		const withdrawTx = await program.rpc.withdraw(
			id  
			,{
			accounts: {
			authority: notAuthorised.publicKey,
			delegatePda: delegatePda,
			carbonAuth: authPda2, // Make sure this is the correct config PDA
			systemProgram: SystemProgram.programId,
			rent: anchor.web3.SYSVAR_RENT_PUBKEY,
			},
			signers: [notAuthorised],
		});

	} catch (error) {
			// Check if the error is the expected "InvalidAuthority" error
			if (error.message.includes("AccountNotInitialized")|| error.message.includes("The program expected this account to be already initialized.")) {
				didThrowExpectedError = true;
			} else {
				// If the error is not what we expected, rethrow it to fail the test with the actual error message
				throw error;
			}
	}
})