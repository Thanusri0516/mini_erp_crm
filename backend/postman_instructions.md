# Postman Collection Testing Guide

This guide explains how to import and use the pre-configured Postman Collection located at [postman_collection.json](file:///c:/Users/thanu/Documents/projects/MiniERP+CRM%20Operations%20portal/backend/postman_collection.json) to test all backend REST API endpoints.

---

## 📥 Step 1: Import the Collection into Postman
1. Open **Postman** desktop application or log in to the browser web dashboard.
2. Click the **Import** button in the top-left corner.
3. Drag and drop the [postman_collection.json](file:///c:/Users/thanu/Documents/projects/MiniERP+CRM%20Operations%20portal/backend/postman_collection.json) file or browse and select it.
4. Click **Import** to confirm. A new collection named **"Mini ERP + CRM API Collection"** will appear in your sidebar.

---

## ⚙️ Step 2: Configure Environment Variables
The collection is designed to use variables so you don't have to manually paste headers or change domain names on every request.

1. Click on the collection name **"Mini ERP + CRM API Collection"** in your sidebar.
2. Select the **Variables** tab in the main window.
3. Configure the following variables:
   * `base_url`:
     * For **local testing**: Set the *Initial Value* and *Current Value* to `http://localhost:5000`.
     * For **production testing**: Set it to your live Render backend URL (e.g. `https://mini-erp-backend-ikrf.onrender.com`).
   * `jwt_token`: *(Leave this empty for now. We will fill it in the next step).*
4. Click **Save** (Ctrl+S or Cmd+S) in the top right.

---

## 🔑 Step 3: Authenticate and Login
All database operations require a JWT authentication token.

1. Expand the **Authentication** folder in the collection.
2. Select **User Login**.
3. Go to the **Body** tab. The default credentials are set to the Admin preset:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
   *(You can change `username` and `password` to test other roles like `sales`, `warehouse`, or `accounts` using their respective credentials).*
4. Click **Send**.
5. In the response window, copy the string returned in the `"token"` field.
6. Go back to the **Collection Variables** tab (from Step 2), paste the token into the **Current Value** field of the `jwt_token` variable, and click **Save**.
7. All other requests in the collection are now authenticated and ready to run!

---

## 📡 Request Groups & Sample Payloads

### 1. Customer CRM
* **List Customers**: `GET {{base_url}}/api/customers`
  * *Parameters*: `search`, `type`, `status`, `page`, `limit` (configurable in the Params tab).
* **Create Customer**: `POST {{base_url}}/api/customers`
  * *Sample Body (JSON)*:
    ```json
    {
      "name": "Tesla India",
      "mobile": "9876543210",
      "email": "contact@tesla.in",
      "businessName": "Tesla Motors India Private Limited",
      "gstNumber": "27AAAAA1111A1Z1",
      "type": "Distributor",
      "address": "Palo Alto Tech Park, Sector 4, Mumbai",
      "status": "Lead",
      "notes": "Interested in bulk battery purchases."
    }
    ```
* **Add Timeline Note**: `POST {{base_url}}/api/customers/1/notes`
  * *Sample Body (JSON)*:
    ```json
    {
      "note": "Scheduled catalog presentation call for next Monday."
    }
    ```

---

### 2. Products & Inventory
* **List Products**: `GET {{base_url}}/api/products`
  * *Parameters*: `search`, `category`, `lowStock` (set to `true` to check low stock alerts).
* **Create Product**: `POST {{base_url}}/api/products`
  * *Sample Body (JSON)*:
    ```json
    {
      "name": "Logitech MX Master 3S",
      "sku": "MS-LOG-MX3S",
      "category": "Accessories",
      "unitPrice": 9500,
      "currentStock": 45,
      "minStockAlert": 10,
      "location": "Warehouse A - Bin 14"
    }
    ```
* **Adjust Stock (IN/OUT)**: `POST {{base_url}}/api/products/1/adjust`
  * *Sample Body (JSON)*:
    ```json
    {
      "quantityDelta": 15,
      "reason": "Received container delivery"
    }
    ```

---

### 3. Sales Challans (Billing)
* **Create Challan (Draft or Confirmed)**: `POST {{base_url}}/api/challans`
  * *Sample Body (JSON)*:
    ```json
    {
      "customerId": 1,
      "status": "DRAFT",
      "items": [
        {
          "productId": 1,
          "quantity": 5
        }
      ]
    }
    ```
* **Confirm Draft Challan**: `PUT {{base_url}}/api/challans/1/confirm`
  * *Effect*: Verifies inventory, atomically deducts stock, and saves catalog snapshots.
* **Cancel Confirmed Challan**: `PUT {{base_url}}/api/challans/1/cancel`
  * *Effect*: Changes status to `CANCELLED`, restores items back to active stock levels, and writes history log logs.
