import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  Account,
  Address,
  nativeToScVal,
  scValToNative,
  Horizon,
} from "@stellar/stellar-sdk";
import { kit } from "./wallet";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID;
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;

const server = new rpc.Server(RPC_URL, { allowHttp: true });

// Read-only simulation — uses the connected wallet as fee source (no signing needed, just a valid address).
async function readContract(callerAddress, method, args = []) {
  if (!CONTRACT_ID || !callerAddress) return null;
  const contract = new Contract(CONTRACT_ID);
  const account = new Account(callerAddress, "0");

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (sim.error || !sim.result) return null;
  return scValToNative(sim.result.retval);
}

async function simulateAndFire(method, args, signerAddress) {
  if (!CONTRACT_ID) throw new Error("Contract ID not configured.");
  const contract = new Contract(CONTRACT_ID);

  let account;
  try {
    account = await server.getAccount(signerAddress);
  } catch {
    throw new Error("Could not fetch account. Is this address funded on Testnet?");
  }

  const tx = new TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (sim.error) throw new Error("Simulation failed: " + sim.error);

  // assembleTransaction returns a TransactionBuilder in v15 — must call .build() first
  const assembledTx = rpc.assembleTransaction(tx, sim).build();
  const xdr = assembledTx.toXDR();

  const { signedTxXdr } = await kit.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    account: signerAddress,
  });
  if (!signedTxXdr) throw new Error("Signing cancelled or failed.");

  console.log("Submitting signed XDR to network:", NETWORK_PASSPHRASE);
  const submitted = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  );
  if (submitted.status === "ERROR") {
    throw new Error("Transaction submission failed.");
  }

  return await waitForTransaction(submitted.hash);
}

async function waitForTransaction(hash) {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const tx = await server.getTransaction(hash);
    if (tx.status === "SUCCESS") return tx;
    if (tx.status === "FAILED") throw new Error("Transaction failed on-chain.");
  }
  throw new Error("Transaction timed out.");
}

function mapReview(raw, id = null) {
  if (!raw) return null;
  // scValToNative renders a Soroban struct as a plain JS object keyed by field name
  return {
    id: String(raw.id ?? id),
    author: String(raw.author ?? ""),
    subject: String(raw.subject ?? ""),
    score: Number(raw.score ?? 0),
    content: String(raw.content ?? ""),
    timestamp: Number(raw.timestamp ?? 0),
    upvotes: Number(raw.upvotes ?? 0),
    downvotes: Number(raw.downvotes ?? 0),
  };
}

export async function fetchReviews(callerAddress) {
  const totalRaw = await readContract(callerAddress, "get_total_reviews");
  if (totalRaw == null) return [];

  const total = Number(totalRaw);
  const reviews = [];

  for (let i = 1; i <= total; i++) {
    const raw = await readContract(callerAddress, "get_review", [
      nativeToScVal(i, { type: "u32" }),
    ]);
    const r = mapReview(raw, i);
    if (r) reviews.push(r);
  }

  return reviews.sort((a, b) => b.timestamp - a.timestamp);
}

export async function fetchReviewsByWallet(callerAddress, subject_wallet) {
  if (!subject_wallet) return [];
  const rawList = await readContract(callerAddress, "get_reviews_by_wallet", [
    new Address(subject_wallet).toScVal(),
  ]);
  if (!rawList || !Array.isArray(rawList)) return [];

  return rawList.map(r => mapReview(r)).filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
}

export async function submitReview({ author, subject, score, content }) {
  const args = [
    new Address(author).toScVal(),
    new Address(subject).toScVal(),
    nativeToScVal(Number(score), { type: "u32" }),
    nativeToScVal(content, { type: "string" }),
  ];
  await simulateAndFire("add_review", args, author);
}

export async function voteOnReview({ reviewId, voter, direction }) {
  const args = [
    new Address(voter).toScVal(),
    nativeToScVal(Number(reviewId), { type: "u32" }),
    nativeToScVal(direction === "up", { type: "bool" }),
  ];
  await simulateAndFire("vote_review", args, voter);
}

export async function fetchReputation(callerAddress, targetAddress) {
  const addr = targetAddress || callerAddress;
  if (!addr) return 0;
  const raw = await readContract(callerAddress, "get_reputation", [
    new Address(addr).toScVal(),
  ]);
  return raw != null ? Number(raw) : 0;
}

export async function getUserVote({ voter, reviewId }) {
  if (!voter || !reviewId) return null;
  const voted = await readContract(voter, "has_voted", [
    new Address(voter).toScVal(),
    nativeToScVal(Number(reviewId), { type: "u32" })
  ]);
  // Since the contract returns a bool, but we want 'up' or 'down' for UI highlighting,
  // and the contract currently only tracks existence of the vote (true if voted),
  // we'll return 'voted' as a boolean. 
  // Future update could store types, but for now 'true' means they can't vote again.
  return voted ? "voted" : null;
}
