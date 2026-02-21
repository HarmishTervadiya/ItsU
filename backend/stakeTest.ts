import { prisma } from '@itsu/shared/src/lib/prisma';
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58' 

const SOLANA_RPC = "https://api.devnet.solana.com";
const connection = new Connection(SOLANA_RPC, "confirmed");

// ⚠️ Load private key for source wallet
// Example: export SOURCE_SECRET='[12,34,56,...]'
const sourceSecret = bs58.decode("")
const sourceKeypair = Keypair.fromSecretKey(new Uint8Array(sourceSecret));

// Main flow
async function main() {
  // STEP 1: Create pending DB transaction
  const referenceKeypair = Keypair.generate();

  const destinationPubkey = new PublicKey(
    "9uUYYvkEjEQTd7T5VgqEFkiWgFnTsRfiDqVEdwz5BEDS"
  );

  const transferAmount = 0.005 * LAMPORTS_PER_SOL;

  const dbTx = await prisma.transaction.create({
    data: {
      reference: referenceKeypair.publicKey.toBase58(),
      userId: "e64f057c-9ccf-4326-9b55-d4ed4ee2b0ce",
      type: "DEPOSIT_STANDARD",
      currency: "SOL",
      amount: BigInt(transferAmount),
      status: "PENDING",
    },
  });

  console.log(
    `Created DB Transaction: ${dbTx.id} with Reference: ${dbTx.reference}`
  );

  // STEP 2: Send SOL with reference (NO AIRDROP)
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: sourceKeypair.publicKey,
    toPubkey: destinationPubkey,
    lamports: transferAmount,
  });

  // Add reference for tracking
  transferInstruction.keys.push({
    pubkey: referenceKeypair.publicKey,
    isSigner: false,
    isWritable: false,
  });

  const tx = new Transaction().add(transferInstruction);

  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [sourceKeypair] // Sign with real source wallet
  );

  console.log(`Transaction sent! Signature: ${signature}`);

  await prisma.transaction.update({
    where: { id: dbTx.id },
    data: { txSignature: signature },
  });

  // STEP 3: Verify transaction
  const parsedTx = await connection.getParsedTransaction(signature, "confirmed");
  if (!parsedTx || parsedTx.meta?.err) return markFailed(dbTx.id);

  const accountKeys = parsedTx.transaction.message.accountKeys.map((k) =>
    k.pubkey.toBase58()
  );

  if (!accountKeys.includes(dbTx.reference)) return markFailed(dbTx.id);

  const transferInst = parsedTx.transaction.message.instructions.find(
    (inst: any) =>
      inst.program === "system" && inst.parsed?.type === "transfer"
  );

  if (!transferInst) return markFailed(dbTx.id);

  const { destination, lamports } = transferInst.parsed.info;

  if (destination !== destinationPubkey.toBase58())
    return markFailed(dbTx.id);

  if (BigInt(lamports) !== dbTx.amount)
    return markFailed(dbTx.id);

  await prisma.transaction.update({
    where: { id: dbTx.id },
    data: { status: "CONFIRMED" },
  });

  console.log("✅ Verification successful!");
}

async function markFailed(id: string) {
  await prisma.transaction.update({
    where: { id },
    data: { status: "FAILED" },
  });
  console.error(`Transaction ${id} marked as FAILED`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());