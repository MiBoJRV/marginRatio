const ccxt = require('ccxt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Function for the formatting of numbers
function formatNumber(num) {
    return parseFloat(num).toFixed(8);
}

// Function for printing exchange info
function printExchangeInfo(exchangeName, data) {
    console.log(`\n========= ${exchangeName} Margin Account Details =========`);
    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'number') {
            console.log(`${key}: ${formatNumber(value)}`);
        }
    });
    console.log('=' . repeat(50));
}

async function testConnection() {
    try {
        const exchanges = {
            binance: new ccxt.binance({
                'apiKey': process.env.BINANCE_API_KEY,
                'secret': process.env.BINANCE_SECRET_KEY,
                'enableRateLimit': true,
                'options': {
                    'defaultType': 'margin',
                }
            }),
            bybit: new ccxt.bybit({
                'apiKey': process.env.BYBIT_API_KEY,
                'secret': process.env.BYBIT_SECRET_KEY,
                'enableRateLimit': true,
                'options': {
                    'defaultType': 'margin',
                }
            }),
            htx: new ccxt.htx({
                'apiKey': process.env.HTX_API_KEY,
                'secret': process.env.HTX_SECRET_KEY,
                'enableRateLimit': true,
                'options': {
                    'defaultType': 'margin',
                }
            }),
            okx: new ccxt.okx({
                'apiKey': process.env.OKX_API_KEY,
                'secret': process.env.OKX_SECRET_KEY,
                'password': process.env.OKX_PASSPHRASE,
                'enableRateLimit': true,
                'options': {
                    'defaultType': 'margin',
                }
            }),
            hyperliquid: new ccxt.hyperliquid({
                'apiKey': process.env.HYPERLIQUID_API_KEY,
                'secret': process.env.HYPERLIQUID_SECRET_KEY,
                'enableRateLimit': true,
                'options': {
                    'defaultType': 'margin',
                }
            }),
            kucoin: new ccxt.kucoin({
                'apiKey': process.env.KUCOIN_API_KEY,
                'secret': process.env.KUCOIN_SECRET_KEY,
                'password': process.env.KUCOIN_PASSPHRASE,
                'enableRateLimit': true,
                'options': {
                    'defaultType': 'margin',
                }
            }),
        }

        for (const exchangeName in exchanges) {
            const exchange = exchanges[exchangeName];
            const markets = await exchange.loadMarkets();
            console.log(`Successfully connected to ${exchangeName}!`);
        }

        return true;
    } catch (error) {
        console.error('Connection test failed:', error.message);
        return false;
    }
}

async function getMarginRatioBinance() {
    try {
        // Initialize Binance exchange
        const exchange = new ccxt.binance({
            'apiKey': process.env.BINANCE_API_KEY,
            'secret': process.env.BINANCE_SECRET_KEY,
            'enableRateLimit': true,
            'options': {
                'defaultType': 'margin',
            }
        });

        // Fetch margin account information
        const marginAccount = await exchange.sapi_get_margin_account();

        // Extract necessary values for margin ratio calculation
        const totalAssetOfBtc = parseFloat(marginAccount.totalAssetOfBtc);
        const totalLiabilityOfBtc = parseFloat(marginAccount.totalLiabilityOfBtc);
        const totalNetAssetOfBtc = parseFloat(marginAccount.totalNetAssetOfBtc);

        // Calculate margin ratio
        const marginRatio = totalNetAssetOfBtc > 0 ?
            (totalLiabilityOfBtc / totalAssetOfBtc) * 100 : 0;

        // Print results
        printExchangeInfo('Binance', {
            'Total Asset (BTC)': totalAssetOfBtc,
            'Total Liability (BTC)': totalLiabilityOfBtc,
            'Total Net Asset (BTC)': totalNetAssetOfBtc,
            'Margin Ratio (%)': marginRatio
        });

        return marginRatio;
    } catch (error) {
        if (error.name === 'AuthenticationError') {
            console.error('Binance Authentication failed. Please check your API keys.');
        } else if (error.name === 'PermissionDenied') {
            console.error('Binance Permission denied. Make sure your API key has margin trading permissions.');
        } else {
            console.error('Error fetching Binance margin ratio:', error.message);
        }
        throw error;
    }
}

async function getMarginRatioBybit() {
    try {
        // Initialize Bybit exchange
        const exchange = new ccxt.bybit({
            'apiKey': process.env.BYBIT_API_KEY,
            'secret': process.env.BYBIT_SECRET_KEY,
            'enableRateLimit': true,
            'options': {
                'defaultType': 'margin',
                'defaultSubType': 'LINEAR', // Important for margin data on Bybit
            }
        });

        // Fetch Bybit account balance - This is the closest equivalent for margin info
        const balance = await exchange.fetchBalance();
        console.log("Bybit Balance Info:", JSON.stringify(balance.info, null, 2));

        // Adapt code to the actual structure of balance.info
        const accountInfo = balance.info.result.list[0]; // Get the first account object
        const totalEquity = parseFloat(accountInfo.totalEquity);
        const availableBalance = parseFloat(accountInfo.totalAvailableBalance);
        const usedMargin = totalEquity - availableBalance;


        // Calculate Margin Ratio  (Estimation)
        const marginRatio = totalEquity > 0 ? (usedMargin / totalEquity) * 100 : 0;

        // Print results
        printExchangeInfo('Bybit', {
            'Total Equity (USDT)': totalEquity,
            'Available Balance (USDT)': availableBalance,
            'Used Margin (USDT)': usedMargin,
            'Margin Ratio (%)': marginRatio
        });

        return marginRatio;

    } catch (error) {
        if (error.name === 'AuthenticationError') {
            console.error('Bybit Authentication failed. Please check your API keys.');
        } else if (error.name === 'PermissionDenied') {
            console.error('Bybit Permission denied. Make sure your API key has margin trading permissions.');
        } else {
            console.error('Error fetching Bybit margin ratio:', error.message);
        }
        throw error;
    }
}

async function getMarginRatioHTX() {
    try {
        // Initialize HTX exchange
        const exchange = new ccxt.htx({
            'apiKey': process.env.HTX_API_KEY,
            'secret': process.env.HTX_SECRET_KEY,
            'enableRateLimit': true,
            'options': {
                'defaultType': 'margin',
            }
        });

        // Fetch margin account information
        const marginAccount = await exchange.privateGetMarginAccountsBalance();
        console.log("HTX Balance Info:", JSON.stringify(marginAccount, null, 2));
        
        // Extract necessary values for margin ratio calculation
        const accountInfo = marginAccount.data;
        const totalAssetInBTC = parseFloat(accountInfo?.totalAssetOfBtc || 0);
        const totalLiabilityInBTC = parseFloat(accountInfo?.totalLiabilityOfBtc || 0);
        const totalNetAssetInBTC = totalAssetInBTC - totalLiabilityInBTC;

        // Calculate margin ratio
        const marginRatio = totalAssetInBTC > 0 ?
            (totalLiabilityInBTC / totalAssetInBTC) * 100 : 0;

        // Print results
        printExchangeInfo('HTX', {
            'Total Asset (BTC)': totalAssetInBTC,
            'Total Liability (BTC)': totalLiabilityInBTC,
            'Total Net Asset (BTC)': totalNetAssetInBTC,
            'Margin Ratio (%)': marginRatio
        });

        return marginRatio;
    } catch (error) {
        if (error.name === 'AuthenticationError') {
            console.error('HTX Authentication failed. Please check your API keys.');
        } else if (error.name === 'PermissionDenied') {
            console.error('HTX Permission denied. Make sure your API key has margin trading permissions.');
        } else {
            console.error('Error fetching HTX margin ratio:', error.message);
        }
        throw error;
    }
}

async function getMarginRatioOKX() {
    try {
        // Initialize OKX exchange
        const exchange = new ccxt.okx({
            'apiKey': process.env.OKX_API_KEY,
            'secret': process.env.OKX_SECRET_KEY,
            'password': process.env.OKX_PASSPHRASE,
            'enableRateLimit': true,
            'options': {
                'defaultType': 'margin',
            }
        });

        // Fetch margin account information
        const marginAccount = await exchange.privateGetAccountBalance();
        console.log("OKX Balance Info:", JSON.stringify(marginAccount, null, 2));
        
        // Extract necessary values for margin ratio calculation
        const accountInfo = marginAccount.data?.[0] || {};
        const totalEquity = parseFloat(accountInfo.totalEq || 0);
        const debt = parseFloat(accountInfo.debt || 0);
        const equity = parseFloat(accountInfo.eq || 0);

        // Calculate margin ratio
        const marginRatio = totalEquity > 0 ?
            (debt / totalEquity) * 100 : 0;

        // Print results
        printExchangeInfo('OKX', {
            'Total Equity (USDT)': totalEquity,
            'Debt (USDT)': debt,
            'Equity (USDT)': equity,
            'Margin Ratio (%)': marginRatio
        });

        return marginRatio;
    } catch (error) {
        if (error.name === 'AuthenticationError') {
            console.error('OKX Authentication failed. Please check your API keys.');
        } else if (error.name === 'PermissionDenied') {
            console.error('OKX Permission denied. Make sure your API key has margin trading permissions.');
        } else {
            console.error('Error fetching OKX margin ratio:', error.message);
        }
        throw error;
    }
}

async function getMarginRatioHyperliquid() {
    try {
        // Initialize Hyperliquid exchange
        const exchange = new ccxt.hyperliquid({
            'apiKey': process.env.HYPERLIQUID_API_KEY,
            'secret': process.env.HYPERLIQUID_SECRET_KEY,
            'enableRateLimit': true,
            'options': {
                'defaultType': 'margin',
                'adjustForTimeDifference': true,
                'defaultAddress': process.env.HYPERLIQUID_WALLET_ADDRESS.toLowerCase(),
            }
        });

        // Fetch account information using wallet address
        const walletAddress = process.env.HYPERLIQUID_WALLET_ADDRESS.toLowerCase();
        console.log('Using wallet address:', walletAddress);
        const balance = await exchange.fetchBalance({
            'params': {
                'address': walletAddress,
                'user': walletAddress,
                'wallet': walletAddress
            }
        });
        console.log("Hyperliquid Balance Info:", JSON.stringify(balance.info, null, 2));
        
        // Extract necessary values for margin ratio calculation
        const positions = balance.info?.positions || [];
        const totalCollateral = positions.reduce((sum, pos) => sum + parseFloat(pos.collateral || 0), 0);
        const usedMargin = positions.reduce((sum, pos) => sum + parseFloat(pos.margin || 0), 0);
        const freeCollateral = totalCollateral - usedMargin;

        // Calculate margin ratio as used/total
        const marginRatio = totalCollateral > 0 ?
            (usedMargin / totalCollateral) * 100 : 0;

        // Print results
        printExchangeInfo('Hyperliquid', {
            'Total Collateral (USD)': totalCollateral,
            'Used Margin (USD)': usedMargin,
            'Free Collateral (USD)': freeCollateral,
            'Margin Ratio (%)': marginRatio
        });

        return marginRatio;
    } catch (error) {
        if (error.name === 'AuthenticationError') {
            console.error('Hyperliquid Authentication failed. Please check your wallet address.');
        } else if (error.name === 'PermissionDenied') {
            console.error('Hyperliquid Permission denied. Make sure your wallet has required permissions.');
        } else {
            console.error('Error fetching Hyperliquid margin ratio:', error.message);
            console.error('Full error:', error);
        }
        throw error;
    }
}

async function getMarginRatioKucoin() {
    try {
        // Initialize KuCoin exchange
        const exchange = new ccxt.kucoin({
            'apiKey': process.env.KUCOIN_API_KEY,
            'secret': process.env.KUCOIN_SECRET_KEY,
            'password': process.env.KUCOIN_PASSPHRASE,
            'enableRateLimit': true,
            'options': {
                'defaultType': 'margin',
            }
        });

        // Fetch margin account information
        const marginAccount = await exchange.privateGetMarginAccount();
        console.log("KuCoin Balance Info:", JSON.stringify(marginAccount, null, 2));
        
        // Extract necessary values for margin ratio calculation
        const accountInfo = marginAccount.data || {};
        const debtRatio = parseFloat(accountInfo.debtRatio || 0);
        const totalDebt = parseFloat(accountInfo.totalDebt || 0);
        const totalAsset = parseFloat(accountInfo.totalAsset || 0);

        // Calculate margin ratio (KuCoin provides debt ratio directly)
        const marginRatio = debtRatio;

        // Print results
        printExchangeInfo('KuCoin', {
            'Total Asset (USDT)': totalAsset,
            'Total Debt (USDT)': totalDebt,
            'Debt Ratio (%)': debtRatio,
            'Margin Ratio (%)': marginRatio
        });

        return marginRatio;
    } catch (error) {
        if (error.name === 'AuthenticationError') {
            console.error('KuCoin Authentication failed. Please check your API keys.');
        } else if (error.name === 'PermissionDenied') {
            console.error('KuCoin Permission denied. Make sure your API key has margin trading permissions.');
        } else {
            console.error('Error fetching KuCoin margin ratio:', error.message);
            console.error('Full error:', error);
        }
        throw error;
    }
}

// Properly handle async execution
(async function() {
    try {
        // First test the connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to establish connection with exchanges');
        }

        const binanceRatio = await getMarginRatioBinance();
        console.log('Binance margin ratio fetched successfully');

        const bybitRatio = await getMarginRatioBybit();
        console.log('Bybit margin ratio fetched successfully');

        const htxRatio = await getMarginRatioHTX();
        console.log('HTX margin ratio fetched successfully');

        const okxRatio = await getMarginRatioOKX();
        console.log('OKX margin ratio fetched successfully');

        const hyperliquidRatio = await getMarginRatioHyperliquid();
        console.log('Hyperliquid margin ratio fetched successfully');

        const kucoinRatio = await getMarginRatioKucoin();
        console.log('KuCoin margin ratio fetched successfully');

        console.log('\n========= Summary of All Exchanges =========');
        console.log('Binance Margin Ratio: ' + formatNumber(binanceRatio) + '%');
        console.log('Bybit Margin Ratio: ' + formatNumber(bybitRatio) + '%');
        console.log('HTX Margin Ratio: ' + formatNumber(htxRatio) + '%');
        console.log('OKX Margin Ratio: ' + formatNumber(okxRatio) + '%');
        console.log('Hyperliquid Margin Ratio: ' + formatNumber(hyperliquidRatio) + '%');
        console.log('KuCoin Margin Ratio: ' + formatNumber(kucoinRatio) + '%');
        console.log('=' . repeat(50));

    } catch (error) {
        if (!error.message.includes('Authentication')) {
            console.error('Failed to fetch margin ratio. Please try again.');
        }
    }
})();