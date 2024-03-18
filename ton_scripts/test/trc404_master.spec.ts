import { owned_nft_limit,freemint_max_supply,freemint_price } from "../contract/compileContract";
import { getWalletContract, user1, user2 } from "../contract/clientAndWallet";
import { WalletContractV4 } from "@ton/ton";
import { OpenedContract, fromNano, toNano,Address } from "@ton/core";

import "@ton/test-utils";
import { Cell } from "@ton/core";
import { Trc404Master, checkMintFtTX } from "./warpper/Trc404Master";
import { Trc404Wallet } from "./warpper/Trc404Wallet";
import { Trc404NftCollection } from "./warpper/Trc404NftCollection";
import { Trc404NftItem } from "./warpper/Trc404NftItem";
import { deployAndCheckCollectionAndMasterContract,checkMintFt } from "../utils/check";

import {
    Blockchain,
    SandboxContract,
    TreasuryContract,
    printTransactionFees,
    prettyLogTransactions,
    RemoteBlockchainStorage,
    wrapTonClient4ForRemote,
} from "@ton/sandbox";
import { getInitDeployMasterMsg } from "../contract/initDeployContract";
import {buildMintFtMsg,buildWithdrawMsg,buildChangeFreemintConfigMsg,buildChangeMasterAdminMsg} from "../message/masterMsg";


let max_supply =100000;


describe('Test Trc404 Master admin Mint ', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let Collection: SandboxContract<Trc404NftCollection>;
    let Master: SandboxContract<Trc404Master>;

    
    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        let res=await deployAndCheckCollectionAndMasterContract(blockchain,deployer);
        Master=res.Master;
        Collection=res.Collection;
    });
    
     //**** Should be error cases  */
    it('should not mint FT when sender is not admin', async () => {
        let mintAmount =1;
        let gasFee = 0.15; //0.15 ton   gas_fee nees 0.15 ~  0.1 * owned_nft_limit/toNano("1") 
        let user1 = await blockchain.treasury("user1");
        let userAddress=user1.address;
        let msg = buildMintFtMsg(userAddress,mintAmount) ;
        const mintFfResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(mintFfResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: false,
        });
    })
     //**** Should be correct cases  */
    it('should mint 1 FT and 1 NFT', async () => {
        let mintAmount =1;
        let gasFee = 0.15; //0.15 ton   gas_fee nees 0.15 ~  0.1 * owned_nft_limit/toNano("1") 
        let user1 = await blockchain.treasury("user1");
        let userAddress=user1.address;
        let nft_item_index =1n;
        let msg = buildMintFtMsg(userAddress,mintAmount) ;
        await checkMintFt(mintAmount,gasFee,deployer,blockchain,Master,Collection,userAddress,nft_item_index,msg);
    })

    it('should mint 1.5 FT and 1 NFT', async () => {
        let mintAmount =1.5;
        let gasFee = 0.15; //0.15 ton   gas_fee nees 0.15 ~  0.1 * owned_nft_limit/toNano("1") 
        let user2 = await blockchain.treasury("user2");
        let userAddress=user2.address;
        let nft_item_index =2n;
        let msg = buildMintFtMsg(userAddress,mintAmount) ;
        await checkMintFt(mintAmount,gasFee,deployer,blockchain,Master,Collection,userAddress,nft_item_index,msg);
    })

    it('should mint 10000 FT and '+owned_nft_limit+' NFT', async () => {
        let mintAmount =10000;
        let gasFee = 0.1 * owned_nft_limit; //0.15 ton   gas_fee nees 0.15 ~  0.1 * owned_nft_limit/toNano("1") 
        let user3 = await blockchain.treasury("user3");
        let userAddress=user3.address;
        let nft_item_index =3n;
        let msg = buildMintFtMsg(userAddress,mintAmount) ;
        await checkMintFt(mintAmount,gasFee,deployer,blockchain,Master,Collection,userAddress,nft_item_index,msg);
    })
})


describe('Test Trc404 Master freeMint and withdraw ', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let Collection: SandboxContract<Trc404NftCollection>;
    let Master: SandboxContract<Trc404Master>;
    let user3:SandboxContract<TreasuryContract>;

    
    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        let res=await deployAndCheckCollectionAndMasterContract(blockchain,deployer);
        Master=res.Master;
        Collection=res.Collection;
    });

    //**** Should be error cases  */
    //1. less than one freemint_price
    it('should not freeMint FT when msg_value is less than freemint_price', async () => {
        //let mintAmount =1;
        let gasFee = freemint_price -0.01 ; // gasfee=  mintAmount* freemint_price
        let user1 = await blockchain.treasury("user1");
        let msg =Cell.EMPTY ;  //empty msg for freemint
        const freemintFfResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(freemintFfResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: false,
        });   
    })

    //2.exceed freemint_max_supply
    it('should not freeMint FT when mint number exceed freemint_max_supply', async () => {
        let mintAmount =freemint_max_supply +1;
        let gasFee = mintAmount * freemint_price ; // gasfee=  mintAmount* freemint_price
        let user1 = await blockchain.treasury("user1");
        let msg =Cell.EMPTY ;  //empty msg for freemint
        const freemintFfResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(freemintFfResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: false,
        });   
    })

    //3.exceed token max_supply
    it('should not freeMint FT when mint number exceed token max_supply', async () => {
        let mintAmount =max_supply +1;
        let gasFee = mintAmount * freemint_price ; // gasfee=  mintAmount* freemint_price
        let user1 = await blockchain.treasury("user1");
        let msg =Cell.EMPTY ;  //empty msg for freemint
        const freemintFfResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(freemintFfResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: false,
        });   
    })

    //4. not admin when withdraw
    it('should not withdraw 1 ton when sender is not admin ', async () => {
        let withdrawAmount =1;
        let gasFee = 0.01; //
        user3 = await blockchain.treasury("user3");
        let msg =buildWithdrawMsg(withdrawAmount,user3.address) ;    
        const withdrawResult = await Master.send(user3.getSender(), { value: toNano(gasFee) },msg);   
        expect(withdrawResult.transactions).toHaveTransaction({
            from: user3.address,
            to: Master.address,
            success: false,
        });        
    })

    //**** Should be correct cases  */
    it('should freeMint 1 FT and 1 NFT to sender', async () => {
        let mintAmount =1;
        let gasFee = mintAmount * freemint_price; // gasfee=  mintAmount* freemint_price
        let user1 = await blockchain.treasury("user1");
        let nft_item_index =1n;
        let msg =Cell.EMPTY ;  //empty msg for freemint
        await checkMintFt(mintAmount,gasFee,user1,blockchain,Master,Collection,user1.address,nft_item_index,msg);
        //check master contract balance
        expect(Master.address)
        let masterBalance = (await blockchain.getContract(Master.address)).balance;
        //console.log("masterBalance:",masterBalance); //need to spend 0.13 as gas fee
        expect(masterBalance).toBeGreaterThan(toNano(gasFee- mintAmount*0.2));

    })

    it('should freeMint 1.5 FT and 1 NFT to sender', async () => {
        let mintAmount =1.5;
        let gasFee = mintAmount * freemint_price; // gasfee=  mintAmount* freemint_price
        let user2 = await blockchain.treasury("user2");
        let nft_item_index =2n;
        let msg =Cell.EMPTY ;  //empty msg for freemint
        await checkMintFt(mintAmount,gasFee,user2,blockchain,Master,Collection,user2.address,nft_item_index,msg);
        let masterBalance = (await blockchain.getContract(Master.address)).balance;
        //console.log("masterBalance:",masterBalance); //need to spend 0.13 as gas fee
        expect(masterBalance).toBeGreaterThan(toNano(gasFee- mintAmount*0.2));
    })

    it('should freeMint 500 FT and '+ owned_nft_limit+' NFT to sender', async () => {
        let mintAmount =500;   //max_freemint_supply is 1000
        let gasFee = mintAmount * freemint_price; // gasfee=  mintAmount* freemint_price
        let nft_item_index =3n;
        let msg =Cell.EMPTY ;  //empty msg for freemint
        await checkMintFt(mintAmount,gasFee,user3,blockchain,Master,Collection,user3.address,nft_item_index,msg);
        let masterBalance = (await blockchain.getContract(Master.address)).balance;
        //console.log("masterBalance:",masterBalance); //need to spend 0.13 as gas fee
        expect(masterBalance).toBeGreaterThan(toNano(gasFee- mintAmount*0.2));
    })

    it('should withdraw 100 ton', async () => {
        let withdrawAmount =100;
        let gasFee = 0.01; //
        let msg =buildWithdrawMsg(withdrawAmount,user3.address) ;  //empty msg for freemint

        let userBalanceBefore=await user3.getBalance();
        //console.log("userBalanceBefore:",userBalanceBefore);
        const withdrawResult = await Master.send(deployer.getSender(), { value: toNano(gasFee) },msg);   
        expect(withdrawResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: Master.address,
            success: true,
        });
        let userBalanceAfter=await user3.getBalance();
        //console.log("userBalanceAfter:",userBalanceAfter);   
        expect(userBalanceAfter - userBalanceBefore+ toNano(0.01)).toBeGreaterThan(toNano(100));
         
    })
})


describe('Test Trc404 Master ChangeFreemintConfig  and ChangeMasterAdmin ', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let Collection: SandboxContract<Trc404NftCollection>;
    let Master: SandboxContract<Trc404Master>;
    let user1:SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        let res=await deployAndCheckCollectionAndMasterContract(blockchain,deployer);
        Master=res.Master;
        Collection=res.Collection;
    });

    
     //**** Should be error cases  */
    it('should not change_admin when sender is not admin ', async () => {
        let gasFee = 0.01 ; 
        user1 = await blockchain.treasury("user1");
        let msg = buildChangeMasterAdminMsg(user1.address);  //empty msg for freemint
        const changeAdminResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(changeAdminResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: false,
        });   
    })

    it('should not change_freemint_config when sender is not admin ', async () => {
        let gasFee = 0.01 ; 
        let freemint_flag=0; //-1 :true,0:false
        let freemint_max_supply=500; 
        let freemint_price =3 ;// 3 Ton
        let msg =buildChangeFreemintConfigMsg(freemint_flag,freemint_max_supply,freemint_price) ;  //empty msg for freemint
        const chageFreemintConfigResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(chageFreemintConfigResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: false,
        });   
    })

     //**** Should be correct cases  */
     it('should change_admin when sender is admin ', async () => {
        let gasFee = 0.01 ; // gasfee=  mintAmount* freemint_price
        let msg = buildChangeMasterAdminMsg(user1.address);  //empty msg for freemint
        const changeAdminResult = await Master.send(deployer.getSender(), { value: toNano(gasFee) },msg);  
        expect(changeAdminResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: Master.address,
            success: true,
        });   
        //check new admin address
        const new_owner = (await Master.getGetJettonData()).owner;
        expect(new_owner).toEqualAddress(user1.address);
    })

    it('should change_freemint_config when sender is admin ', async () => {
        let gasFee = 0.01 ; 
        let freemint_flag=0; //-1 :true,0:false
        let freemint_max_supply=500; 
        let freemint_price =3 ;// 3 Ton

        let msg =buildChangeFreemintConfigMsg(freemint_flag,freemint_max_supply,freemint_price) ;  //empty msg for freemint
        const chageFreemintConfigResult = await Master.send(user1.getSender(), { value: toNano(gasFee) },msg);  
        expect(chageFreemintConfigResult.transactions).toHaveTransaction({
            from: user1.address,
            to: Master.address,
            success: true,
        });   

        //check free_mint_config
        const new_freemint_flag = (await Master.getGetJettonData()).freemint_flag;
        const new_freemint_max_supply = (await Master.getGetJettonData()).freemint_max_supply;
        const new_freemint_price = (await Master.getGetJettonData()).freemint_price;
        expect(freemint_flag).toEqual(new_freemint_flag);
        expect(toNano(freemint_max_supply)).toEqual(new_freemint_max_supply);
        expect(toNano(freemint_price)).toEqual(new_freemint_price);

    })

})