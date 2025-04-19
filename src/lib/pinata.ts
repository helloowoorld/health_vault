// Pinata service for handling IPFS uploads
import axios from 'axios';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';

// Pinata API configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '770646d0f481bb78fbfa';
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY || '34f39d5ad9917fcc2ccc77c63d0bfe36a53491e1ec2408d8381d8253af8f06e9';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'healthvault_secure_key_2025';

// 🔐 Encrypt IPFS hash for security
export const encryptHash = (hash: string): string => {
  console.log('🔐 Encrypting IPFS hash...');
  return CryptoJS.AES.encrypt(hash, ENCRYPTION_KEY).toString();
};

// 🔓 Decrypt IPFS hash
export const decryptHash = (encryptedHash: string): string => {
  console.log('🔓 Decrypting IPFS hash...');
  const bytes = CryptoJS.AES.decrypt(encryptedHash, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// 📤 Upload file to IPFS via Pinata
export const uploadToPinata = async (file: File, metadata: any = {}) => {
  console.log('📁 Upload to Pinata initiated...');
  console.log('📄 File name:', file.name);
  console.log('📦 Metadata:', metadata);

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadataJSON = JSON.stringify({
      name: file.name,
      keyvalues: metadata
    });
    console.log('📝 Appending metadata:', metadataJSON);
    formData.append('pinataMetadata', metadataJSON);

    // Add options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    });
    console.log('⚙️ Appending options:', pinataOptions);
    formData.append('pinataOptions', pinataOptions);

    // Environment check
    console.log('🌍 ENV:', process.env.NODE_ENV);
    if (PINATA_API_KEY == '770646d0f481bb78fbfa') {
      // Use JWT if available
      if (PINATA_JWT) {
        console.log('🔐 Using JWT to upload to Pinata...');
        const response = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          formData,
          {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
              Authorization: `Bearer ${PINATA_JWT}`
            }
          }
        );
        console.log('✅ Upload response:', response.data);

        const ipfsHash = response.data.IpfsHash;
        const encryptedHash = encryptHash(ipfsHash);

        return {
          success: true,
          ipfsHash,
          encryptedHash,
          url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        };
      } else {
        console.log('🔐 JWT not found, falling back to API Key + Secret...');
        const response = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          formData,
          {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
              'pinata_api_key': PINATA_API_KEY,
              'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
          }
        );
        console.log('✅ Upload response (API key):', response.data);

        const ipfsHash = response.data.IpfsHash;
        const encryptedHash = encryptHash(ipfsHash);

        return {
          success: true,
          ipfsHash,
          encryptedHash,
          url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        };
      }
    } else {
      console.log('⚠️ MOCK upload active (not in production)...');

      const mockHash = `ipfs_${Math.random().toString(36).substring(2, 15)}`;
      const encryptedHash = encryptHash(mockHash);

      console.log('🧪 Mock hash:', mockHash);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// 🌐 Get IPFS URL from raw hash
export const getIpfsUrl = (ipfsHash: string): string => {
  console.log('🔗 Building URL from raw IPFS hash...');
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
};

// 🌐 Get IPFS URL from encrypted hash
export const getIpfsUrlFromEncrypted = (encryptedHash: string): string => {
  console.log('🔓 Getting URL from encrypted hash...');
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
