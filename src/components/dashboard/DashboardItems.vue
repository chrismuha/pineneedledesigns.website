<template>
  <div class="items-page">
    <div class="page-header">
    <h1>Items</h1>

    <div class="header-actions">
        <RouterLink
        to="/dashboard/create"
        class="create-btn"
        >
        Create New Item
        </RouterLink>

        <button class="manage-btn">
            Edit Collections
            <!-- You should be able to rename, delete and add collections. deleting collection will move all items to uncategorized collection. -->
        </button>
    </div>
    </div>

    <!-- COLLECTION 1 -->
    <details open class="collection">
      <summary>
        Placeholder Collection Name 1
        <span class="collection-count">(3 Items)</span>
      </summary>

      <div class="item-card">
        <div class="item-header">
          <h3>Premium Hoodie</h3>

          <div class="badges">
            <span class="badge green">In Stock</span>
            <span class="badge blue">Free Shipping</span>
          </div>
        </div>

        <div class="photo-grid">
          <div class="photo">IMG</div>
          <div class="photo">IMG</div>
          <div class="photo">IMG</div>
          <div class="photo">IMG</div>
        </div>

        <div class="item-details">
          <p><strong>Collection:</strong> Placeholder Collection Name 1</p>
          <p><strong>Price:</strong> $49.99</p>
          <p><strong>Color:</strong> Black</p>
          <p><strong>Size:</strong> S, M, L, XL</p>

          <p>
            <strong>Important Notes:</strong><br>
            Ships within 2 business days.
          </p>

          <p>
            <strong>Description:</strong><br>
            Premium heavyweight hoodie designed for comfort and durability.
          </p>

          <div class="custom-properties">
            <h4>Custom Properties</h4>

            <div class="property">
              <strong>Color *</strong>
              <ul>
                <li>Red</li>
                <li>Blue</li>
                <li>Green</li>
              </ul>
            </div>

            <div class="property">
              <strong>Print Position</strong>
              <ul>
                <li>Front</li>
                <li>Back</li>
                <li>Sleeve</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="edit-btn">
            Edit
          </button>

          <button class="delete-btn">
            Remove
          </button>
        </div>
      </div>

      <div class="item-card">
        <h3>Classic T-Shirt</h3>
        <p>Example item preview...</p>

        <div class="actions">
          <button class="edit-btn">
            Edit
          </button>

          <button class="delete-btn">
            Remove
          </button>
        </div>
      </div>

      <div class="item-card">
        <h3>Graphic Tee</h3>
        <p>Example item preview...</p>

        <div class="actions">
          <button class="edit-btn">
            Edit
          </button>

          <button class="delete-btn">
            Remove
          </button>
        </div>
      </div>
    </details>

    <!-- COLLECTION 2 -->
    <details class="collection">
      <summary>
        Placeholder Collection Name 2
        <span class="collection-count">(4 Items)</span>
      </summary>

      <div class="item-card">
        Example item card...
      </div>
    </details>

    <!-- COLLECTION 3 -->
    <details class="collection">
      <summary>
        Uncategorized (These items have no collection.)
        <span class="collection-count">(2 Items)</span>
      </summary>

      <div class="item-card">
        Example item card...
      </div>
    </details>
    

    <!-- EDIT MODAL MOCKUP -->

    <section class="demo-modal">
      <h2>Edit Item Modal Example</h2>

      <div class="modal-card">

        <div class="field">
          <label>Item Name</label>
          <input type="text" value="Premium Hoodie">
        </div>

        <div class="field">
          <label>Collection</label>
          <select>
            <option>Placeholder Collection Name 1</option>
            <option>Placeholder Collection Name 2</option>
            <option>Placeholder Collection Name 3</option>
          </select>
        </div>

        <div class="field">
          <label>Color</label>
          <input type="text" value="Black">
        </div>

        <div class="field">
          <label>Size</label>
          <input type="text" value="S, M, L, XL">
        </div>

        <div class="field">
          <label>Important Notes</label>
          <textarea rows="3">
Ships within 2 business days.
          </textarea>
        </div>

        <div class="field">
          <label>Description</label>
          <textarea rows="6">
Premium heavyweight hoodie designed for comfort and durability.
          </textarea>
        </div>

        <div class="field">
          <label>Price (USD)</label>
          <input type="number" value="49.99">
        </div>

        <div class="field">
          <label>
            <input type="checkbox" checked>
            Free Shipping
          </label>
        </div>

        <div class="field">
          <label>
            <input type="checkbox">
            Out Of Stock
          </label>
        </div>

        <div class="modal-actions">
          <button>
            Cancel
          </button>

          <button class="continue-btn">
            Continue
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.items-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.create-btn {
  background: #2ea44f;
  color: white;
  padding: 12px 18px;
  border-radius: 8px;
  text-decoration: none;
}

.collection {
  margin-bottom: 20px;
  border: 1px solid #d9e8dc;
  border-radius: 12px;
  overflow: hidden;
}

.collection summary {
  padding: 16px;
  background: #f3faf4;
  cursor: pointer;
  font-weight: 600;
}

.collection-count {
  color: #666;
  margin-left: 10px;
}

.item-card {
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 100px);
  gap: 12px;
  margin: 20px 0;
}

.photo {
  aspect-ratio: 1;
  background: #ececec;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: .85rem;
}

.green {
  background: #dff6e5;
}

.blue {
  background: #ddefff;
}

.red {
  background: #ffe2e2;
}

.custom-properties {
  margin-top: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.edit-btn {
  background: #2ea44f;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
}

.delete-btn {
  background: #d9534f;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
}

.demo-modal {
  margin-top: 50px;
}

.modal-card {
  border: 1px solid #d9e8dc;
  border-radius: 12px;
  padding: 24px;
  background: white;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 8px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.continue-btn,
.confirm-btn {
  background: #2ea44f;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
}
.header-actions {
  display: flex;
  gap: 12px;
}

.manage-btn {
  background: white;
  border: 1px solid #2ea44f;
  color: #2ea44f;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
}
</style>