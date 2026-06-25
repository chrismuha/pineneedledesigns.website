<template>
  <div class="create-item-page">
    <div class="page-header">
      <h1>Create Item</h1>
      <RouterLink to="/dashboard/items" class="view-items-btn">
        View All Items
      </RouterLink>
    </div>

    <form class="item-form">

      <!-- BASIC INFORMATION -->
      <section class="card">
        <h2>Basic Information</h2>

        <div class="form-grid">
          <div class="field">
            <label>Item Name *</label>
            <input type="text" placeholder="Premium Hoodie">
          </div>

          <div class="field">
            <label>Collection *</label>
            <select>
              <option>T-Shirts</option>
              <option>Hoodies</option>
              <option>Accessories</option>
              <option>Posters</option>
            </select>
          </div>

          <div class="field">
            <label>Color</label>
            <input type="text" placeholder="Black">
          </div>

          <div class="field">
            <label>Size</label>
            <input type="text" placeholder="S, M, L, XL">
          </div>
        </div>

        <div class="field">
          <label>Important Notes</label>
          <textarea rows="4"></textarea>
        </div>

        <div class="field">
          <label>Description *</label>
          <textarea rows="8"></textarea>
        </div>
      </section>

      <!-- CUSTOM PROPERTIES -->
      <section class="card">
        <div class="section-header">
          <h2>Custom Properties</h2>

          <button type="button" class="green-btn">
            + Add Property
          </button>
        </div>

        <div class="property-card">
          <div class="property-top">
            <input
              type="text"
              placeholder="Property Name (e.g. Color)"
            >

            <label class="checkbox-row">
              <input type="checkbox">
              Required
            </label>

            <button type="button" class="danger-btn">
              Remove
            </button>
          </div>

          <div class="property-options">
            <h4>Dropdown Options</h4>

            <div class="option-row">
              <input type="text" placeholder="Red">
              <button type="button">Remove</button>
            </div>

            <div class="option-row">
              <input type="text" placeholder="Blue">
              <button type="button">Remove</button>
            </div>

            <button type="button" class="green-btn">
              + Add Option
            </button>
          </div>
        </div>
      </section>

      <!-- PHOTOS -->
      <section class="card">
        <h2>Photos *</h2>

        <input type="file" multiple accept="image/*">

        <p class="hint">
          Upload as many photos as needed.
        </p>

        <div class="photo-grid">
          <div class="photo-box">
            Preview
          </div>

          <div class="photo-box">
            Preview
          </div>

          <div class="photo-box">
            Preview
          </div>

          <div class="photo-box">
            Preview
          </div>
        </div>
      </section>

      <!-- PRICING -->
      <section class="card">
        <h2>Pricing & Shipping</h2>

        <div class="form-grid">
          <div class="field">
            <label>Price (USD) *</label>
            <input type="number" placeholder="49.99">
          </div>

          <div class="field">
            <label>Shipping Cost *</label>
            <input type="number" placeholder="5.00">
          </div>
        </div>

        <label class="checkbox-row">
          <input type="checkbox">
          Free Shipping
        </label>
      </section>

      <!-- INVENTORY -->
      <section class="card">
        <h2>Inventory</h2>

        <label class="checkbox-row">
          <input type="checkbox">
          Out Of Stock
        </label>
      </section>

      <!-- ACTIONS -->
      <div class="actions">
        <button type="button" class="clear-btn">
          Clear
        </button>

        <button type="submit" class="submit-btn">
          Create Item
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>
.create-item-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
}

.view-items-btn {
  text-decoration: none;
}

.item-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #fff;
  border: 1px solid #d8eadb;
  border-radius: 14px;
  padding: 24px;
}

.card h2 {
  margin-top: 0;
  color: #1f7a3d;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cfd8cf;
  border-radius: 8px;
  padding: 12px;
  font: inherit;
}

textarea {
  resize: vertical;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.property-card {
  border: 1px solid #d8eadb;
  border-radius: 10px;
  padding: 16px;
}

.property-top {
  display: flex;
  gap: 16px;
  align-items: center;
}

.property-top input {
  flex: 1;
}

.property-options {
  margin-top: 16px;
}

.option-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.option-row input {
  flex: 1;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.photo-box {
  aspect-ratio: 1;
  border: 2px dashed #c7d9ca;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.green-btn,
.submit-btn {
  background: #2ea44f;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
}

.clear-btn {
  background: #f3f3f3;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
}

.danger-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
}

.actions {
  display: flex;
  gap: 12px;
}

.hint {
  color: #666;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .property-top {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>