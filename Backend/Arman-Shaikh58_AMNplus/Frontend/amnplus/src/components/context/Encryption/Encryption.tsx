

export const deriveKeyFromUID=async(uid:string)=>
{
    const encoder = new TextEncoder();
  const salt = encoder.encode("Whoever_changes_this_is_a_Gay"); 

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(uid),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export const encryptData=async(plaintext: string, key:CryptoKey)=> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Random IV

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encrypted))
  };
}
export const decryptData =async ({ iv, ciphertext }:  any, key:CryptoKey) =>{
  const ivArray = new Uint8Array(iv);
  const encryptedArray = new Uint8Array(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivArray,
    },
    key,
    encryptedArray
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
