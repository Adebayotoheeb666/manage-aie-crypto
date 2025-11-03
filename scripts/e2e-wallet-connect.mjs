import { ethers } from "ethers";

(async function () {
  try {
    // create a random wallet for the test
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    console.log("Using test wallet:", address);

    const base = "http://localhost:8080";

    // 1) get nonce
    const nonceResp = await fetch(`${base}/api/auth/nonce?address=${address}`);
    const nonceBody = await nonceResp.text();
    console.log("Nonce response status:", nonceResp.status);
    console.log("Nonce response body:", nonceBody);
    if (!nonceResp.ok) {
      console.error("Failed to obtain nonce");
      process.exit(1);
    }

    const nonceData = JSON.parse(nonceBody);
    const nonce = String(nonceData.nonce || "");
    if (!nonce) {
      console.error("No nonce received");
      process.exit(1);
    }
    console.log("Received nonce:", nonce);

    // 2) sign nonce
    const signature = await wallet.signMessage(nonce);
    console.log("Signature:", signature);

    // 3) POST wallet-connect
    const resp = await fetch(`${base}/api/auth/wallet-connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address, signature, nonce }),
      credentials: "include",
    });

    const text = await resp.text();
    console.log("wallet-connect status:", resp.status);
    console.log("wallet-connect body:", text);

    if (resp.ok) {
      console.log("E2E wallet-connect succeeded");
    } else {
      console.error("E2E wallet-connect failed");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error during e2e:", err);
    process.exit(1);
  }
})();
