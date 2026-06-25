<template>
  <div class="orders-page">
    <h1>Orders</h1>

    <div class="orders-list">

      <details open class="order-card">
        <summary>
          <div class="order-summary">
            <div>
              <strong>#100254</strong><br>
              <span>Jun 26, 2026</span><br>
              <span>Click to expand or collapse</span>
            </div>

            <div class="order-badges">
              <span class="badge badge-open">OPEN</span>
            </div>
          </div>
        </summary>

        <div class="order-content">

          <section class="order-section">
            <h3>Customer Information</h3>

            <div class="info-grid">
              <div>
                <label>Email</label>
                <p>example@gmail.com</p>
              </div>

              <div>
                <label>Phone</label>
                <p>555-123-4567</p>
              </div>

              <div>
                <label>Customer Type</label>
                <p>Individual</p>
              </div>
            </div>
          </section>

          <section class="order-section">
            <h3>Billing Address</h3>

            <p>John Doe</p>
            <p>All Address Information Goes Here</p>
          </section>

          <section class="order-section">
            <h3>Shipping Address</h3>

            <div class="same-address">
              Same as billing address
            </div>
          </section>

          <section class="order-section">
            <h3>Order Items</h3>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>The Crowned Hare Vest</td>
                  <td>1</td>
                  <td>$77.00</td>
                  <td>-$30.80</td>
                  <td>$0.84</td>
                  <td>$47.04</td>
                </tr>

                <tr>
                  <td>Bracelet Brandi</td>
                  <td>1</td>
                  <td>$29.00</td>
                  <td>-$11.60</td>
                  <td>$0.32</td>
                  <td>$17.72</td>
                </tr>

                <tr>
                  <td>Adeline Bracelet</td>
                  <td>1</td>
                  <td>$32.00</td>
                  <td>-$12.80</td>
                  <td>$0.35</td>
                  <td>$19.55</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="order-section">
            <h3>Totals</h3>

            <div class="totals">
              <div><span>Subtotal</span><span>$138.00</span></div>
              <div><span>Discount</span><span>-$55.20</span></div>
              <div><span>Total without tax</span><span>$82.80</span></div>
              <div><span>Tax</span><span>$1.51</span></div>
              <div class="final-total">
                <span>Final Total</span>
                <span>$84.31</span>
              </div>
            </div>
          </section>

          <section class="order-section">
            <h3>Tax Breakdown</h3>

            <p>
              Comilla, Aleutians West Census Area, Alaska
            </p>

            <ul>
              <li>State Tax: 0%</li>
              <li>Local Tax: 1.821%</li>
              <li>Combined Tax: 1.821%</li>
            </ul>
          </section>

          <section class="order-section">
            <h3>Order Timeline</h3>

            <div class="timeline">
              <div>10:15 AM - Order Submitted</div>
            </div>
          </section>

          <div class="order-actions">
            <button class="close-btn">
              Close Order
            </button>
          </div>

        </div>
      </details>

      <details class="order-card">
        <summary>
          <div class="order-summary">
            <div>
              <strong>#100255</strong><br>
              <span>Jun 25, 2026</span><br>
              <span>Click to expand or collapse</span>
            </div>

            <div class="order-badges">
              <span class="badge badge-closed">CLOSED</span>
            </div>
          </div>
        </summary>

        <div class="order-content">
          <p>
            Same structure as above...
          </p>

          <div class="order-actions">
            <button class="reopen-btn">
              Reopen Order
            </button>
          </div>
        </div>
      </details>

    </div>
  </div>
</template>
<style scoped>
.orders-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  border: 1px solid #dfe7df;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.order-card summary {
  padding: 18px;
  cursor: pointer;
  list-style: none;
}

.order-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-content {
  padding: 24px;
  border-top: 1px solid #eee;
}

.order-section {
  margin-bottom: 30px;
}

.order-section h3 {
  color: #2ea44f;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 10px;
  border: 1px solid #ddd;
}

.badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: .8rem;
}

.badge-paid {
  background: #e3f8e8;
}

.badge-open {
  background: #dff1ff;
}

.badge-closed {
  background: #ffe4e4;
}

.order-actions {
  display: flex;
  gap: 12px;
}

.close-btn,
.edit-btn,
.reopen-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn {
  background: #d9534f;
  color: white;
}

.edit-btn,
.reopen-btn {
  background: #2ea44f;
  color: white;
}
</style>