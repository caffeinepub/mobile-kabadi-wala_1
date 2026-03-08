# Mobile Kabadi Wala

## Current State
- Seller form: brand, model, storage, condition, address, description, seller name, phone number
- Admin panel: lists all submissions, filter by status, update status -- no password protection
- Backend stores: id, brand, modelName, storage, condition, address, description, sellerName, phoneNumber, status, submittedAt

## Requested Changes (Diff)

### Add
- Seller form: optional photo upload fields -- "मोबाइल फोटो" and "मदरबोर्ड फोटो" (both optional, no pressure on seller)
- Photos stored via blob-storage component, URLs saved in listing
- Admin panel: password login screen (hardcoded password: `Afifa@7862`) -- admin must enter password to view listings; session persists until page close

### Modify
- Backend MobileListing type: replace `description` field with `mobilePhotoUrl` (opt) and `motherboardPhotoUrl` (opt), both stored as `?Text`
- submitListing function: accept optional photo URLs instead of description
- Seller form: remove description textarea, add two optional image upload buttons (mobile photo + motherboard photo)
- Admin panel: wrap entire panel in password gate; show photo thumbnails in listing cards

### Remove
- Description field from seller form and backend

## Implementation Plan
1. Select blob-storage Caffeine component
2. Update backend Motoko: change MobileListing type, update submitListing signature
3. Update SellerPage: remove description, add two optional image upload fields using blob-storage hook
4. Update AdminPage: add password gate (localStorage-based session), show photo thumbnails in listing cards
5. Validate and deploy
