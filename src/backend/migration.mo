import Map "mo:core/Map";
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
    mobilePhoto : ?Storage.ExternalBlob;
    motherboardPhoto : ?Storage.ExternalBlob;
    sellerName : Text;
    phoneNumber : Text;
    status : Text;
    submittedAt : Int;
  };

  type OldActor = {
    nextListingId : Nat;
    listings : Map.Map<Nat, OldMobileListing>;
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
    pickupDateTime : ?Text;
  };

  type NewActor = {
    nextListingId : Nat;
    listings : Map.Map<Nat, NewMobileListing>;
  };

  public func run(old : OldActor) : NewActor {
    let newListings = old.listings.map<Nat, OldMobileListing, NewMobileListing>(
      func(_id, oldListing) {
        { oldListing with pickupDateTime = null };
      }
    );
    { old with listings = newListings };
  };
};
