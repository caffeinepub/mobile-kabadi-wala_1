import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Storage "blob-storage/Storage";

module {
  type OldMobileListing = {
    id : Nat;
    brand : Text;
    modelName : Text;
    storage : Text;
    condition : Text;
    address : Text;
    description : Text;
    sellerName : Text;
    phoneNumber : Text;
    status : Text;
    submittedAt : Int;
  };

  type OldActor = {
    listings : Map.Map<Nat, OldMobileListing>;
    nextListingId : Nat;
  };

  type NewMobileListing = {
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

  type NewActor = {
    listings : Map.Map<Nat, NewMobileListing>;
    nextListingId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newListings = old.listings.map<Nat, OldMobileListing, NewMobileListing>(
      func(_id, oldListing) {
        {
          oldListing with
          mobilePhoto = null : ?Storage.ExternalBlob;
          motherboardPhoto = null : ?Storage.ExternalBlob;
        };
      }
    );
    { old with listings = newListings };
  };
};
