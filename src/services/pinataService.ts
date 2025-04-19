import axios from 'axios';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';

// 🌐 Environment Variables
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'healthvault_secure_key_2025';
const USE_REAL_UPLOAD = import.meta.env.VITE_USE_REAL_PINATA === 'true' || import.meta.env.MODE === 'production';

// 🔐 Encrypt IPFS hash
export const encryptHash = (hash: string): string => {
  console.log('🔐 Encrypting hash...');
  return CryptoJS.AES.encrypt(hash, ENCRYPTION_KEY).toString();
};

// 🔓 Decrypt IPFS hash
export const decryptHash = (encryptedHash: string): string => {
  console.log('🔓 Decrypting hash...');
  const bytes = CryptoJS.AES.decrypt(encryptedHash, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// 📤 Upload file to Pinata
export const uploadToPinata = async (file: File, metadata: any = {}) => {
  console.log('📤 Starting upload to Pinata...');
  console.log('🧾 File:', file);
  console.log('🧠 Metadata:', metadata);
  console.log('🌐 USE_REAL_UPLOAD:', USE_REAL_UPLOAD);

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add Metadata
    const metadataJSON = JSON.stringify({
      name: file.name,
      keyvalues: metadata
    });
    console.log('📦 pinataMetadata:', metadataJSON);
    formData.append('pinataMetadata', metadataJSON);

    // Add Pinata Options
    const optionsJSON = JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    });
    console.log('⚙️ pinataOptions:', optionsJSON);
    formData.append('pinataOptions', optionsJSON);

    if (USE_REAL_UPLOAD) {
      console.log('🚀 Uploading to Pinata via API KEY/SECRET...');
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
            Authorization: `Bearer ${PINATA_JWT}` // <-- THIS ONE
          }
        }
      );

      console.log('✅ Pinata response:', response.data);

      const ipfsHash = response.data.IpfsHash;
      const encryptedHash = encryptHash(ipfsHash);
      console.log('🔐 Encrypted IPFS Hash:', encryptedHash);

      return {
        success: true,
        ipfsHash,
        encryptedHash,
        url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      };
    } else {
      console.warn('⚠️ MOCK upload enabled (development only)');

      const mockHash = `ipfs_${Math.random().toString(36).substring(2, 15)}`;
      const encryptedHash = encryptHash(mockHash);
      console.log('🧪 Mock IPFS Hash:', mockHash);
      console.log('🔐 Encrypted Mock Hash:', encryptedHash);

      return {
        success: true,
        ipfsHash: mockHash,
        encryptedHash,
        url: `https://gateway.pinata.cloud/ipfs/${mockHash}`
      };
    }
  } catch (error) {
    console.error('❌ Error uploading to Pinata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// 🔗 Get IPFS gateway URL from raw hash
export const getIpfsUrl = (ipfsHash: string): string => {
  console.log('🌐 Getting IPFS URL from raw hash...');
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
};

// 🔗 Get IPFS gateway URL from encrypted hash
export const getIpfsUrlFromEncrypted = (encryptedHash: string): string => {
  console.log('🌐 Getting IPFS URL from encrypted hash...');
  const decryptedHash = decryptHash(encryptedHash);
  return getIpfsUrl(decryptedHash);
};

export default {
  uploadToPinata,
  encryptHash,
  decryptHash,
  getIpfsUrl,
  getIpfsUrlFromEncrypted
};
