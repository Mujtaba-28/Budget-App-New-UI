
export const isBiometricAvailable = async () => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
};

export const registerBiometric = async (userName: string) => {
    if (!window.PublicKeyCredential) return false;

    // Random challenge (In a real backend app, this comes from the server)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
            name: "Emerald Finance",
            id: window.location.hostname // Must match current domain
        },
        user: {
            id: userId,
            name: userName,
            displayName: userName
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
            authenticatorAttachment: "platform", // FaceID/TouchID
            userVerification: "required"
        },
        timeout: 60000,
        attestation: "direct"
    };

    try {
        const credential = await navigator.credentials.create({ publicKey });
        if (credential) {
            // In a real app, send credential to server. Here we assume success if OS prompts.
            localStorage.setItem('emerald_biometric_active', 'true');
            return true;
        }
    } catch (e) {
        console.error("Biometric Registration Failed", e);
        return false;
    }
    return false;
};

export const authenticateBiometric = async () => {
    if (!window.PublicKeyCredential) return false;

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKey: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
    };

    try {
        const assertion = await navigator.credentials.get({ publicKey });
        return !!assertion;
    } catch (e) {
        console.error("Biometric Auth Failed", e);
        return false;
    }
};
