import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MobileListing {
    id: bigint;
    status: string;
    storage: string;
    submittedAt: bigint;
    description: string;
    sellerName: string;
    address: string;
    modelName: string;
    mobilePhoto?: ExternalBlob;
    brand: string;
    phoneNumber: string;
    motherboardPhoto?: ExternalBlob;
    pickupDateTime?: string;
    condition: string;
}
export interface StorageRate {
    storage: string;
    rate: bigint;
}
export interface SubmitListingInput {
    mobilePhotoBlobId?: string;
    storage: string;
    description: string;
    sellerName: string;
    address: string;
    modelName: string;
    motherboardPhotoBlobId?: string;
    brand: string;
    phoneNumber: string;
    condition: string;
}
export interface backendInterface {
    getAllListings(): Promise<Array<MobileListing>>;
    getListingById(id: bigint): Promise<MobileListing | null>;
    getNewListingsCount(): Promise<bigint>;
    getStorageRates(): Promise<Array<StorageRate>>;
    submitListing(input: SubmitListingInput): Promise<bigint>;
    updateListingStatus(id: bigint, status: string): Promise<boolean>;
    updatePickupDateTime(id: bigint, pickupDateTime: string): Promise<boolean>;
    updateStorageRate(storage: string, rate: bigint): Promise<boolean>;
}
