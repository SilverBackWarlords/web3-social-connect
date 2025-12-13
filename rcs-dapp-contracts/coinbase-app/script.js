const connectWalletButton = document.getElementById('connect-wallet');
const disconnectWalletButton = document.getElementById('disconnect-wallet');
const withdrawButton = document.getElementById('withdraw-button');
const createChargeButton = document.getElementById('create-charge-button');
const contractAddressSpan = document.getElementById('contract-address');
const networkSelect = document.getElementById('network-select');

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = [{"inputs":[{"internalType":"uint256","name":"_unlockTime","type":"uint256"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"when","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unlockTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];

let provider;
let signer;
let contract;
let web3Modal;

const networks = {
    "0xa4b1": {
        chainId: "0xa4b1",
        chainName: "Arbitrum One",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://api.web3auth.io/infura-service/v1/0xa4b1/BJo8O4mEbuSGh_LwLHKajvln4UdbOjH8yPd5onT75Qr_oMkxYhK0dczajPCt2MsRS4yk6Vj8_JQvsh8jA6GzOA4"],
        blockExplorerUrls: ["https://arbiscan.io"],
    },
    "0x2105": {
        chainId: "0x2105",
        chainName: "Base",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://api.web3auth.io/infura-service/v1/0x2105/BJo8O4mEbuSGh_LwLHKajvln4UdbOjH8yPd5onT75Qr_oMkxYhK0dczajPCt2MsRS4yk6Vj8_JQvsh8jA6GzOA4"],
        blockExplorerUrls: ["https://basescan.org"],
    },
    "0x89": {
        chainId: "0x89",
        chainName: "Polygon",
        nativeCurrency: {
            name: "Matic",
            symbol: "MATIC",
            decimals: 18,
        },
        rpcUrls: ["https://api.web3auth.io/infura-service/v1/0x89/BJo8O4mEbuSGh_LwLHKajvln4UdbOjH8yPd5onT75Qr_oMkxYhK0dczajPCt2MsRS4yk6Vj8_JQvsh8jA6GzOA4"],
        blockExplorerUrls: ["https://polygonscan.com"],
    }
};

const providerOptions = {
    coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
            appName: "Gemini Dapp Companion",
            infuraId: "BJo8O4mEbuSGh_LwLHKajvln4UdbOjH8yPd5onT75Qr_oMkxYhK0dczajPCt2MsRS4yk6Vj8_JQvsh8jA6GzOA4" // Replace with your Infura ID
        }
    }
};

web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions,
    disableInjectedProvider: false,
});

const connectWallet = async () => {
    try {
        const instance = await web3Modal.connect();
        provider = new ethers.providers.Web3Provider(instance);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const network = await provider.getNetwork();
        
        populateNetworks(network.chainId);
        
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('disconnect-wallet').style.display = 'block';
        document.getElementById('network-section').style.display = 'block';
        document.getElementById('contract-section').style.display = 'block';

        alert('Wallet connected!');

        instance.on("chainChanged", (chainId) => {
            window.location.reload();
        });

        instance.on("accountsChanged", (accounts) => {
            window.location.reload();
        });

    } catch (error) {
        console.error(error);
        alert('Failed to connect wallet.');
    }
};

const disconnectWallet = async () => {
    await web3Modal.clearCachedProvider();
    provider = null;
    signer = null;
    contract = null;

    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('disconnect-wallet').style.display = 'none';
    document.getElementById('network-section').style.display = 'none';
    document.getElementById('contract-section').style.display = 'none';

    alert('Wallet disconnected!');
};

const populateNetworks = (selectedChainId) => {
    networkSelect.innerHTML = '';
    for (const chainId in networks) {
        const option = document.createElement('option');
        option.value = chainId;
        option.innerText = networks[chainId].chainName;
        if (chainId === `0x${selectedChainId.toString(16)}`) {
            option.selected = true;
        }
        networkSelect.appendChild(option);
    }
};

const switchNetwork = async (chainId) => {
    if (!provider) {
        alert('Please connect a wallet first.');
        return;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [networks[chainId]],
                });
            } catch (addError) {
                console.error(addError);
                alert('Failed to add network.');
            }
        } else {
            console.error(switchError);
            alert('Failed to switch network.');
        }
    }
};

connectWalletButton.addEventListener('click', connectWallet);
disconnectWalletButton.addEventListener('click', disconnectWallet);
networkSelect.addEventListener('change', (e) => switchNetwork(e.target.value));

withdrawButton.addEventListener('click', async () => {
    if (!contract) {
        alert('Please connect a wallet first.');
        return;
    }

    try {
        const tx = await contract.withdraw();
        await tx.wait();
        alert('Withdrawal successful!');
    } catch (error) {
        console.error(error);
        alert('Withdrawal failed.');
    }
});

// Placeholder for Coinbase Commerce integration
createChargeButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/create-charge', { method: 'POST' });
        const data = await response.json();
        alert(`Charge created: ${JSON.stringify(data)}`);
    } catch (error) {
        console.error(error);
        alert('Failed to create charge.');
    }
});

// The Facebook login code is preserved but not integrated with the web3 logic.
window.fbAsyncInit = function() {
  FB.init({
    appId      : 'YOUR_APP_ID', // Replace with your App ID
    cookie     : true,
    xfbml      : true,
    version    : 'v13.0'
  });

  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
};

function statusChangeCallback(response) {
  console.log(response);
  if (response.status === 'connected') {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Successful login for: ' + response.name);
    });
  } else {
    console.log('Not logged in.');
  }
}

function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

document.getElementById('fb-login-button').addEventListener('click', function() {
  FB.login(function(response) {
    statusChangeCallback(response);
  }, {scope: 'public_profile,email'});
});