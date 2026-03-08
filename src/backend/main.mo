import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  type MobileListing = {
    id : Nat;
    brand : Text;
    modelName : Text;
    storage : Text;
    condition : Text;
    address : Text;
    description : Text;
    mobilePhoto : ?Storage.ExternalBlob;
    motherboardPhoto : ?Storage.ExternalBlob;
    sellerName : Text;
    phoneNumber : Text;
    status : Text;
    submittedAt : Int;
    pickupDateTime : ?Text;
  };

  type StorageRate = {
    storage : Text;
    rate : Nat;
  };

  // Custom ordering for sorting listings by submittedAt
  module MobileListing {
    public func compareBySubmittedAt(listing1 : MobileListing, listing2 : MobileListing) : Order.Order {
      Int.compare(listing2.submittedAt, listing1.submittedAt); // Descending order
    };
  };

  var nextListingId = 1;
  var listings = Map.empty<Nat, MobileListing>();
  var storageRates = Map.empty<Text, Nat>();

  public type SubmitListingInput = {
    brand : Text;
    modelName : Text;
    storage : Text;
    condition : Text;
    address : Text;
    description : Text;
    sellerName : Text;
    phoneNumber : Text;
    mobilePhotoBlobId : ?Text;
    motherboardPhotoBlobId : ?Text;
  };

  public shared ({ caller }) func submitListing(
    input : SubmitListingInput
  ) : async Nat {
    let id = nextListingId;
    nextListingId += 1;

    let newListing : MobileListing = {
      id;
      brand = input.brand;
      modelName = input.modelName;
      storage = input.storage;
      condition = input.condition;
      address = input.address;
      description = input.description;
      mobilePhoto = null;
      motherboardPhoto = null;
      sellerName = input.sellerName;
      phoneNumber = input.phoneNumber;
      status = "New";
      submittedAt = Time.now();
      pickupDateTime = null;
    };

    listings.add(id, newListing);
    id;
  };

  public query ({ caller }) func getAllListings() : async [MobileListing] {
    listings.values().toArray().sort(MobileListing.compareBySubmittedAt);
  };

  public query ({ caller }) func getListingById(id : Nat) : async ?MobileListing {
    listings.get(id);
  };

  public shared ({ caller }) func updateListingStatus(id : Nat, status : Text) : async Bool {
    switch (listings.get(id)) {
      case (null) { false };
      case (?listing) {
        let updatedListing = { listing with status };
        listings.add(id, updatedListing);
        true;
      };
    };
  };

  public query ({ caller }) func getNewListingsCount() : async Nat {
    listings.values().toArray().filter(
      func(l) { l.status == "New" },
    ).size();
  };

  public shared ({ caller }) func updatePickupDateTime(id : Nat, pickupDateTime : Text) : async Bool {
    switch (listings.get(id)) {
      case (null) { false };
      case (?listing) {
        let updatedListing = { listing with pickupDateTime = ?pickupDateTime };
        listings.add(id, updatedListing);
        true;
      };
    };
  };

  // New Storage Rates Functionality (including "पता नहीं")
  public query ({ caller }) func getStorageRates() : async [StorageRate] {
    let sizes = [
      "16GB",
      "32GB",
      "64GB",
      "128GB",
      "256GB",
      "512GB",
      "1TB",
      "पता नहीं", // Add "पता नहीं" as the last option
    ];

    // Default rates including "पता नहीं"
    if (storageRates.isEmpty()) {
      return [
        { storage = "16GB"; rate = 500 },
        { storage = "32GB"; rate = 800 },
        { storage = "64GB"; rate = 1200 },
        { storage = "128GB"; rate = 2000 },
        { storage = "256GB"; rate = 3200 },
        { storage = "512GB"; rate = 5000 },
        { storage = "1TB"; rate = 8000 },
        { storage = "पता नहीं"; rate = 0 },
      ];
    };

    sizes.map(
      func(size) {
        {
          storage = size;
          rate = switch (storageRates.get(size)) {
            case (null) {
              switch (size) {
                case ("16GB") { 500 };
                case ("32GB") { 800 };
                case ("64GB") { 1200 };
                case ("128GB") { 2000 };
                case ("256GB") { 3200 };
                case ("512GB") { 5000 };
                case ("1TB") { 8000 };
                case ("पता नहीं") { 0 };
                case (_) { 0 };
              };
            };
            case (?r) { r };
          };
        };
      }
    );
  };

  public shared ({ caller }) func updateStorageRate(storage : Text, rate : Nat) : async Bool {
    let validStorages = [
      "16GB",
      "32GB",
      "64GB",
      "128GB",
      "256GB",
      "512GB",
      "1TB",
      "पता नहीं", // Include "पता नहीं" as valid storage
    ];
    var valid = false;
    for (item in validStorages.values()) { if (Text.equal(item, storage)) { valid := true } };
    if (not valid) { return false };

    storageRates.add(storage, rate);
    true;
  };
};
