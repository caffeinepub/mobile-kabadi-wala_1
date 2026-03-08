# Mobile Kabadi Wala

## Current State
- Seller form: brand, model, storage, condition, address, seller name, phone, optional mobile/motherboard photo upload
- Admin panel: password protected (Afifa@7862), shows all listings with status management (New/Reviewed/Offer Made/Purchased/Rejected), filter tabs, refresh button
- Backend: MobileListing type with id, brand, modelName, storage, condition, address, description, mobilePhoto, motherboardPhoto, sellerName, phoneNumber, status, submittedAt
- Backend API: submitListing, getAllListings, updateListingStatus, getNewListingsCount

## Requested Changes (Diff)

### Add
- Admin panel: For each listing card, add a "Pickup Date & Time" section where admin can set a date and time for pickup
- Store pickup date/time as a string field (e.g. "setPickupDateTime") on the listing in backend
- New backend function: updatePickupDateTime(id: Nat, pickupDateTime: Text) : async Bool
- MobileListing type: add pickupDateTime: ?Text field
- In listing card: show the pickup date/time if already set, with a calendar/clock icon
- Admin can edit the pickup date/time using a date picker and time input
- Once set, the pickup date/time is visible on the listing card in admin panel

### Modify
- Backend main.mo: add pickupDateTime field to MobileListing, add updatePickupDateTime function
- Frontend AdminPage.tsx: add pickup date/time UI to ListingCard component

### Remove
- Nothing removed

## Implementation Plan
1. Update backend main.mo: add `pickupDateTime: ?Text` to MobileListing type, update newListing creation, add `updatePickupDateTime` public shared function
2. Update backend.d.ts: add pickupDateTime field to MobileListing interface, add updatePickupDateTime method to backendInterface
3. Update AdminPage.tsx: in ListingCard, add pickup date/time display (if set) and an inline edit UI (date input + time input + save button) for admin to set/update pickup date/time
