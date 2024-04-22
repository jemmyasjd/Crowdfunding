import React, { useContext, createContextuseContext, createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Import your contract ABI here
import CampaignContractABI from './CampaignContractABI.json';

// Assuming you have your contract address defined
const contractAddress = '0x2294f14cBD1C7E1A058e948bE0F4d86eFaA9cb8B';

const StateContext = createContext();

// const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    // Check if MetaMask is installed and injected
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(web3Signer);
    } else {
      console.error("MetaMask not detected. Please install MetaMask.");
    }
  }, []);

  useEffect(() => {
    if (signer) {
      const contractInstance = new ethers.Contract(contractAddress, CampaignContractABI, signer);
      setContract(contractInstance);

      const getAddress = async () => {
        const userAddress = await signer.getAddress();
        setAddress(userAddress);
      };
      getAddress();
    }
  }, [signer]);

  const connect = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };
 
  

  const publishCampaign = async (form) => {
    try {
      const data = await contract.createCampaign(
        address,
        form.title,
        form.description,
        form.target,
        Math.floor(new Date(form.deadline).getTime() / 1000), // deadline should be in seconds
        form.image
      );

      console.log("contract call success", data);
    } catch (error) {
      console.error("contract call failure", error);
    }
  };

  // const getCampaigns = async () => {
  //   try {
     
  //     const campaigns = await contract.getCampaigns();
  //     console.log("campaigns", campaigns);

  //     return campaigns.map((campaign, i) => ({
        
  //       owner: campaign.owner,
  //       title: campaign.title,
  //       description: campaign.description,
  //       target: ethers.utils.formatEther(campaign.target.toString()),
  //       deadline: campaign.deadline.toNumber(),
  //       amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
  //       image: campaign.image,
  //       pId: i
  //     }));
      
  //   } catch (error) {
  //     console.error("Error fetching campaigns:", error);
  //     return [];
  //   }
  // };


  const getCampaigns = async () => {
    try {
      const campaigns = await contract.getCampaigns();
  
      const currentDateInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
  
      return campaigns.map((campaign, i) => {
        const deadlineInSeconds = campaign.deadline.toNumber(); // Convert BigNumber to JavaScript number
        const remainingTimeSeconds = deadlineInSeconds - currentDateInSeconds;
        console.log("remainingTimeSeconds", remainingTimeSeconds);
        const remainingDays = Math.floor(remainingTimeSeconds / (60 * 60 * 24)); // Convert remaining seconds to days
        console.log("remainingDays", remainingDays);

        return {
          owner: campaign.owner,
          title: campaign.title,
          description: campaign.description,
          target: ethers.utils.formatEther(campaign.target.toString()),
          // deadline: new Date(deadlineInSeconds * 1000), // Convert seconds back to Date object
          deadline: remainingDays, // Days left instead of deadline
          amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
          image: campaign.image,
          pId: i
        };
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }
  };
  

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    return allCampaigns.filter((campaign) => campaign.owner === address);
  };

  const donate = async (pId, amount) => {
    try {
      const tx = await contract.donateToCampaign(pId, { value: ethers.utils.parseEther(amount) });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error donating to campaign:", error);
    }
  };

  const getDonations = async (pId) => {
    try {
      const donations = await contract.getDonators(pId);
      const parsedDonations = donations[0].map((donator, i) => ({
        donator,
        donation: ethers.utils.formatEther(donations[1][i].toString())
      }));
      return parsedDonations;
    } catch (error) {
      console.error("Error fetching donations:", error);
      return [];
    }
  };

  return (
    <StateContext.Provider
      value={{ 
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
