### 💻 Frontend Changes (React)
* **Advanced Filter Matrix:** Integrated a robust multi-criteria filtering layout in `ItemList` allowing concurrent filtering by Tracking ID, Store Name (text search), Category, Item Type (Repair, Local Repair, Claim), and Courier Status.
* **Unified & Invoice Search:** Added a unified search field for Article/Color/Size and introduced a dedicated live search filter for **Invoice Numbers** (`invoiceNo` / `invoice`).
* **Strict Flow & Visibility Fixes:**
  * Updated status filtering logic to automatically hide "Claim" types from the Warehouse dispatchable tab.
  * Prevented items marked as "To Customer" from appearing in the Store's Receivable list once dispatched.
* **Synchronized Pending Counts:** Rewrote the `pendingCounts` memoized logic to dynamically align with the updated tab visibility rules, eliminating count mismatches.
* **Dynamic Courier Payload:** Enhanced the Courier Modal to submit context-aware API payloads (`courierName`/`courierSlip` for Store to WH vs `dispatchCourierName`/`dispatchCourierSlip` for WH Dispatches).
* **Real-time Socket Integration:** Added a `useEffect` socket listener for `itemUpdated` and `reconnect` events within `ItemList` to enable instant UI state updates without manual page refreshes (includes proper cleanup hooks).