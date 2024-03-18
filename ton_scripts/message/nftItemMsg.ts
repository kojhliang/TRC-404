
import { Address, beginCell, contractAddress, toNano, internal, fromNano, Cell, OpenedContract, Dictionary } from "@ton/core";

export function buildTransferNftMsg( new_owner_address: Address, response_address: Address) {
    let op_transfer_user_nft = 0x5fcc3d14;
    // .store_uint(query_id, 64)
    // .store_slice(new_owner)                 ;;new owner's client wallet of new ower's erc404 wallet 
    // .store_slice(response_destination)
    // cell custom_payload = in_msg_body~load_dict();
    // int forward_ton_amount = in_msg_body~load_coins();
    // ;;throw_unless(708, slice_bits(in_msg_body) >= 1);
    // slice forward_payload = in_msg_body;

    return beginCell().storeUint(op_transfer_user_nft, 32)  //op_code
        .storeUint(0, 64)  //query_id
        .storeAddress(new_owner_address)     //new owner address  ,nft receiver's client wallet address
        .storeAddress(response_address)    //response_destination
        .storeBit(false)  // custom_payload  // no custom payload ,no use for getgems.io 
        .storeCoins(1)    //forward_ton_amount
        .storeBit(0) //no forward_payload
        .endCell();
}