import React, { useContext, createContext } from 'react';
import { ethers } from 'ethers';

// Import your contract ABI here
import CampaignContractABI from './CampaignContractABI.json';

// Assuming you have your contract address defined
const contractAddress = '0x2294f14cBD1C7E1A058e948bE0F4d86eFaA9cb8B';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const contract = new ethers.Contract(contractAddress, CampaignContractABI, signer);

  const address = signer.getAddress();

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

  const getCampaigns = async () => {
    try {
      const campaigns = await contract.getCampaigns();

      return campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        pId: i
      }));
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
