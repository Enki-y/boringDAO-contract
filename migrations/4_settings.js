const AddressResolver = artifacts.require("AddressResolver");
const AddressBook = artifacts.require("AddressBook");
const ParamBook = artifacts.require("ParamBook");
const Oracle = artifacts.require("Oracle");
const BoringDAO =artifacts.require("BoringDAO");
const FeePool = artifacts.require("FeePool");
const InsurancePool = artifacts.require("InsurancePool");
const MintProposal = artifacts.require("MintProposal")
const Bor = artifacts.require("Bor");
const Tunnel = artifacts.require("Tunnel");
const OToken = artifacts.require("OToken");
const PPToken = artifacts.require("PPToken");

const {trusteesAddress, btcMultiSignAddress} = require("../trustee.json");


const Web3Utils = require('web3-utils');
const toBytes32 = key => Web3Utils.rightPad(Web3Utils.asciiToHex(key), 64);

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(ParamBook);
  const pb = await ParamBook.deployed();

  await deployer.deploy(AddressBook);
  const addrBook = await AddressBook.deployed();
  if (network === "ropsten" || network === "kovan") {
    await addrBook.setAssetMultiSignAddress(
      "BTC",
      "2MtexQG4aypNoVTQajgrYuGY4XhPm2Xr3qx"
    );
  }

  // address resolver settings
  const addrResolver = await AddressResolver.deployed();

  await deployer.deploy(Oracle);
  const oracle = await Oracle.deployed();

  const feePool = await FeePool.deployed();
  const insurancePool = await InsurancePool.deployed();
  const boringDAO = await BoringDAO.deployed();
  const mintProposal = await MintProposal.deployed();
  const tunnel = await Tunnel.deployed();
  const bor = await Bor.deployed();
  const oBTC = await OToken.deployed();
  const pptoken = await PPToken.deployed();

  let keys = ['AddressBook', 'ParamBook', 'Oracle', 'FeePool', 'InsurancePool', 'BoringDAO', 'MintProposal', 'BTC', 'BOR', 'oBTC', "PPT-BTC", "DevUser"].map(toBytes32)
  let addrs = [addrBook.address, pb.address, oracle.address, feePool.address, insurancePool.address, boringDAO.address, mintProposal.address, tunnel.address, bor.address, oBTC.address, pptoken.address, accounts[4]];

  await addrResolver.setMultiAddress(keys, addrs);

  //Address Book=> btc multisign address
  addrBook.setAssetMultiSignAddress("BTC", btcMultiSignAddress);

  // set fee rate
  let names1 = ['BTC', 'BTC', 'BTC', 'BTC', 'BTC', 'BTC', 'BTC', 'BTC', 'BTC'].map(toBytes32);
  let names2 = ['mint_fee', 'burn_fee', 'mint_fee_trustee', 'mint_fee_pledger', 'mint_fee_dev', 'burn_fee_insurance', 'burn_fee_pledger', 'pledge_rate', 'network_fee'].map(toBytes32)
  towei = (n) => Web3Utils.toWei(n) 
  let values = ['0.002', '0.002', '0.15', '0.7', '0.15', '0.5', '0.5', '0.75', '0.0008'].map(towei);
  await pb.setMultiParams2(names1, names2, values);

  // oracle
  if (network == "development") {
    let symbols = ["BOR", "YFI", "SNX", "LINK", "FWETH", "FUSDC", "FDAI", "BTC"].map(toBytes32);
    let prices = ["150", "30000", "5", "10", "380", "1", "1", "10000"].map(towei);
    await oracle.setMultiPrice(symbols, prices);
  } else {
    let symbols = ["BOR", "YFI", "SNX", "LINK", "FWETH", "FUSDC", "FDAI", "BTC"].map(toBytes32);
    let prices = ["150", "30000", "5", "10", "380", "1", "1", "10000"].map(towei);
    await oracle.setMultiPrice(symbols, prices);
  }

  if (network === "ropsten" || network === "kovan") {
    // active tunnel
    await bor.approve(boringDAO.address, towei("60000"));
     await tunnel.setLockDuration(3600);
     await bor.approve(boringDAO.address, Web3Utils.toWei("10000"));
     await boringDAO.pledge(toBytes32("BTC"), Web3Utils.toWei("10000"));
     await tunnel.unpause();
  } else if (network === "development") {
    await tunnel.setLockDuration(60);
  }
};
