import { 
    Cell,
    Slice, 
    Address, 
    Builder, 
    beginCell, 
    ComputeError, 
    TupleItem, 
    TupleReader, 
    Dictionary, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    Contract, 
    ContractABI, 
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';


export class Trc404NftCollection implements Contract {
   
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    
    public constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: Cell) {   
        await provider.internal(via, { ...args, body: message }); 
    }
    
    async getGetCollectionData(provider: ContractProvider) {
        let builder = new TupleBuilder();
        let source = (await provider.get('get_collection_data', builder.build())).stack;
        let next_item_index = source.readBigNumber();
        let collection_content = source.readCell();
        let owner_address = source.readAddress();
        return {next_item_index,collection_content,owner_address};
    }

    async getGetFullData(provider: ContractProvider) {
        let builder = new TupleBuilder();
        let source = (await provider.get('get_full_data', builder.build())).stack;
    //     .store_slice(owner_address) ;; admin address of erc404 Master and collection contract
    // .store_uint(next_item_index, 64)  ;;nft item_index
    // .store_ref(collection_content)  ;;collection_content need to contain item_uri key/value, Dapp should use item_uri + nft_item_content to get the full access url for the nft item,like: https://abc.com/content + nft_level(45) 
    // .store_ref(nft_item_code)         ;; nft_item_code
    // .store_ref(royalty_params)         ;; royalty_params
    // .store_ref(jetton_wallet_code)     ;; jetton_wallet_code
    // .store_uint(total_supply, 64)      ;; total_supply
    // .store_uint(owned_nft_limit, 64)      ;; owned_nft_limit
    // .store_slice(master_address) ;; erc404 Master contract
        let init  =source.readNumber()
        let owner_address = source.readAddress();
        let next_item_index = source.readBigNumber();
        let collection_content = source.readCell();
        let nft_item_code = source.readCell();
        let royalty_params = source.readCell();
        let jetton_wallet_code = source.readCell();
        let total_supply = source.readBigNumber();
        let owned_nft_limit = source.readBigNumber();
        let master_address  =source.readAddressOpt();
        
        return {init,owner_address,next_item_index,collection_content,nft_item_code,royalty_params,
                jetton_wallet_code,total_supply,owned_nft_limit,master_address};
    }
    
    async getGetNftAddressByIndex(provider: ContractProvider, item_index: bigint) {
        let builder = new TupleBuilder();
        builder.writeNumber(item_index);
        let source = (await provider.get('get_nft_address_by_index', builder.build())).stack;
        let result = source.readAddressOpt();
        return result;
    }

    
    async getGetNftContent(provider: ContractProvider, index: bigint, individual_content: Cell) {
        let builder = new TupleBuilder();
        builder.writeNumber(index);
        builder.writeCell(individual_content);
        let source = (await provider.get('get_nft_content', builder.build())).stack;
        let result = source.readCell();
        return result;
    }
    
    async getRoyaltyParams(provider: ContractProvider) {
        let builder = new TupleBuilder();
        let source = (await provider.get('royalty_params', builder.build())).stack;
        let numerator = source.readBigNumber();
        let denominator = source.readBigNumber();
        let owner_address = source.readAddress();

        return {numerator,denominator,owner_address};
    }
 
    
}