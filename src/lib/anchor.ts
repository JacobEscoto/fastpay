import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { IDL, Fastpay } from "../anchor/idl";

type Mutable<T> = {
    -readonly [K in keyof T]: Mutable<T[K]>;
};

type FastpayIdl = Fastpay & Idl;

const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID

const idl: FastpayIdl = {
    ...(IDL as unknown as Mutable<Fastpay>),
    address: PROGRAM_ID,
} as FastpayIdl;

export const getProgram = (wallet: any) => {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "confirmed",
    });

    return new Program<FastpayIdl>(idl, provider);
};