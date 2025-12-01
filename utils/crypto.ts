
// AES-GCM Encryption Utilities

const KEY_STORAGE_NAME = 'emerald_master_key';
const ALGORITHM = 'AES-GCM';

// Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// Get or Create the Master Key
const getMasterKey = async (): Promise<CryptoKey> => {
    // 1. Check if key exists in storage
    const storedKey = localStorage.getItem(KEY_STORAGE_NAME);
    
    if (storedKey) {
        // Import existing key
        const keyData = base64ToArrayBuffer(storedKey);
        return await window.crypto.subtle.importKey(
            'raw',
            keyData,
            ALGORITHM,
            true,
            ['encrypt', 'decrypt']
        );
    } else {
        // Generate new key
        const key = await window.crypto.subtle.generateKey(
            {
                name: ALGORITHM,
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );

        // Export and save key
        const exported = await window.crypto.subtle.exportKey('raw', key);
        localStorage.setItem(KEY_STORAGE_NAME, arrayBufferToBase64(exported));
        return key;
    }
};

let cachedKey: CryptoKey | null = null;

const getKey = async () => {
    if (cachedKey) return cachedKey;
    cachedKey = await getMasterKey();
    return cachedKey;
};

export const encryptData = async (data: any) => {
    try {
        const key = await getKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const encodedData = new TextEncoder().encode(JSON.stringify(data));

        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            key,
            encodedData
        );

        return {
            payload: arrayBufferToBase64(encryptedContent),
            iv: arrayBufferToBase64(iv.buffer)
        };
    } catch (e) {
        console.error("Encryption Failed", e);
        throw e;
    }
};

export const decryptData = async (encryptedData: { payload: string, iv: string }) => {
    try {
        const key = await getKey();
        const iv = base64ToArrayBuffer(encryptedData.iv);
        const ciphertext = base64ToArrayBuffer(encryptedData.payload);

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: new Uint8Array(iv)
            },
            key,
            ciphertext
        );

        const decoded = new TextDecoder().decode(decryptedContent);
        return JSON.parse(decoded);
    } catch (e) {
        console.error("Decryption Failed", e);
        // Fallback: If decryption fails (e.g. wrong key), return null or error
        // This usually implies data corruption or local storage cleared but DB persisted
        return null;
    }
};
