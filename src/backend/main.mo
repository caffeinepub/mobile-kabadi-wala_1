import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";

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
  };

  module MobileListing {
    public func compareBySubmittedAt(listing1 : MobileListing, listing2 : MobileListing) : Order.Order {
      Int.compare(listing2.submittedAt, listing1.submittedAt);
    };
  };

  var nextListingId = 1;
  let listings = Map.empty<Nat, MobileListing>();

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
    };

    listings.add(id, newListing);
    id;
  };

  public query ({ caller }) func getAllListings() : async [MobileListing] {
    listings.values().toArray().sort(MobileListing.compareBySubmittedAt);
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
      func(l) { l.status == "New" }
    ).size();
  };
};
