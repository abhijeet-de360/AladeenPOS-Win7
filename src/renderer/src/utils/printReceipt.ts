import { Order } from '../types'
import { store } from '../store/store'
import { RECEIPT_LOGO_BASE64 } from '../assets/receipt_logo_base64'

export const printThermalReceipt = async (order: Order, _prepMins?: number): Promise<void> => {
  try {
    const isPos = order.type === 'POS'
    const orderTypeLabel = order.deliveryType
      ? order.deliveryType.toUpperCase()
      : isPos
      ? order.table
        ? `DINE-IN (${order.table})`
        : 'TAKEAWAY'
      : 'ONLINE'

    // Order source
    const orderSource = isPos ? 'POS Order' : 'App Online Order'

    // Format date and time
    const rawDate = order.date ? new Date(order.date) : new Date()
    const isValidDate = !isNaN(rawDate.getTime())
    const d = isValidDate ? rawDate : new Date()

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    const dateFormatted = `${day}/${month}/${year}`
    const timeFormatted = `${hours}:${minutes}:${seconds}`

    // Calculate Financial Breakdown
    const sub =
      order.subtotal !== undefined
        ? order.subtotal
        : order.itemList && order.itemList.length > 0
        ? order.itemList.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : order.amount

    const disc =
      order.discountAmount !== undefined
        ? order.discountAmount
        : (order.discount || 0) > 0
        ? (sub * (order.discount || 0)) / 100
        : 0

    const subAfterDisc = sub - disc

    const servicePct = order.servicePercentage || 0
    const service =
      order.serviceFee !== undefined
        ? order.serviceFee
        : servicePct > 0
        ? (subAfterDisc * servicePct) / 100
        : 0

    const subAfterService = subAfterDisc + service

    const taxPct =
      order.taxPercentage !== undefined
        ? order.taxPercentage
        : (() => {
            const state = store.getState()
            const posVat = state.tableTabs?.posVatPercentage
            return typeof posVat === 'number' ? posVat : 7
          })()

    const tax =
      order.taxAmount !== undefined
        ? order.taxAmount
        : subAfterService * (taxPct / 100)

    const rawTotal = subAfterService + tax
    const totalAmount = order.amount !== undefined ? Number(order.amount) : rawTotal
    const rounding = 0.0

    // Build Item Rows with Item, Price, Qty, AMT columns
    let totalQty = 0
    let itemsHtml = ''

    if (order.itemList && order.itemList.length > 0) {
      itemsHtml = order.itemList
        .map((it) => {
          totalQty += it.quantity
          const itemTotal = it.price * it.quantity
          return `
          <tr style="vertical-align: top;">
            <td style="padding: 2px 0; text-align: left; word-break: break-word; font-weight: 600;">${it.name}</td>
            <td style="padding: 2px 0; text-align: right; white-space: nowrap;">${it.price.toFixed(2)}</td>
            <td style="padding: 2px 0; text-align: center; white-space: nowrap;">${it.quantity}</td>
            <td style="padding: 2px 0; text-align: right; white-space: nowrap; font-weight: 600;">${itemTotal.toFixed(2)}</td>
          </tr>`
        })
        .join('')
    } else {
      const splitItems = (order.items || '').split(', ').filter(Boolean)
      itemsHtml = splitItems
        .map((it) => {
          const match = it.match(/^(\d+)x\s*(.*)$/)
          const q = match ? parseInt(match[1]) : 1
          const name = match ? match[2] : it
          totalQty += q
          return `
          <tr style="vertical-align: top;">
            <td style="padding: 2px 0; text-align: left; word-break: break-word; font-weight: 600;">${name}</td>
            <td style="padding: 2px 0; text-align: right; white-space: nowrap;">-</td>
            <td style="padding: 2px 0; text-align: center; white-space: nowrap;">${q}</td>
            <td style="padding: 2px 0; text-align: right; white-space: nowrap; font-weight: 600;">-</td>
          </tr>`
        })
        .join('')
    }

    const paymentMethodName = order.paymentType || (isPos ? 'Cash' : 'Online / Card')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt - ${order.id}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              width: 100%;
              max-width: 76mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              color: #000;
              font-size: 12.5px;
              line-height: 1.35;
            }
            .center {
              text-align: center;
            }
            .header-logo {
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 50%;
              filter: grayscale(100%) contrast(140%);
              -webkit-filter: grayscale(100%) contrast(140%);
              margin: 4px auto;
              display: inline-block;
            }
            .restaurant-title {
              font-size: 15px;
              font-weight: 800;
              margin-top: 4px;
              margin-bottom: 2px;
              letter-spacing: 0.3px;
            }
            .dashed-line {
              border-top: 1px dashed #555;
              margin: 6px 0;
            }
            .info-block {
              font-size: 12px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
            }
            .bold {
              font-weight: 700;
            }
            table.items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
              font-size: 12px;
            }
            table.items-table th {
              border-top: 1px dashed #555;
              border-bottom: 1px dashed #555;
              padding: 4px 0;
              font-weight: 700;
              font-size: 11.5px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: 700;
              font-size: 13px;
              padding: 3px 0;
            }
            .summary-table {
              width: 100%;
              font-size: 11.5px;
              line-height: 1.45;
            }
            .summary-table td {
              padding: 1px 0;
            }
            .paid-amount-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14.5px;
              font-weight: 800;
              margin-top: 4px;
              padding: 2px 0;
            }
          </style>
        </head>
        <body>
          <!-- Top Header: Logo & Restaurant Title -->
          <div class="center">
            <img src="${RECEIPT_LOGO_BASE64}" class="header-logo" alt="Aladeen Logo" />
            <div class="restaurant-title">Aladeen Restaurant</div>
          </div>

          <div class="dashed-line"></div>

          <!-- Order Metadata -->
          <div class="info-block">
            <div>Order Number:</div>
            <div class="bold" style="word-break: break-all; margin-bottom: 2px;">${order.id}</div>
            <div>Order Type: <span class="bold">${orderTypeLabel}</span></div>
            <div>Check-out Time: <span class="bold">${dateFormatted} ${timeFormatted}</span></div>
            <div>Cashier: <span class="bold">${order.customer || 'POS Cashier'}</span></div>
            <div>Order Source: <span class="bold">${orderSource}</span></div>
            ${order.table ? `<div>Table: <span class="bold">${order.table}</span></div>` : ''}
            ${order.customerPhone ? `<div>Customer Phone: <span class="bold">${order.customerPhone}</span></div>` : ''}
          </div>

          ${
            (order.deliveryType || '').toLowerCase() === 'delivery' && order.deliveryAddress
              ? `
            <div class="dashed-line"></div>
            <div class="bold" style="margin-bottom: 2px;">DELIVERY ADDRESS:</div>
            <div style="font-size: 11.5px; line-height: 1.3;">${order.deliveryAddress}</div>
          `
              : ''
          }

          ${
            order.orderNotes
              ? `
            <div class="dashed-line"></div>
            <div class="bold" style="margin-bottom: 2px;">SPECIAL INSTRUCTIONS:</div>
            <div style="font-size: 11.5px;">${order.orderNotes}</div>
          `
              : ''
          }

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 44%;">Item</th>
                <th style="text-align: right; width: 18%;">Price</th>
                <th style="text-align: center; width: 14%;">Qty</th>
                <th style="text-align: right; width: 24%;">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Items Total summary count -->
          <div class="dashed-line"></div>
          <div class="total-row">
            <span>Total</span>
            <span style="display:flex; gap: 20px;">
              <span>${totalQty}</span>
              <span>฿${sub.toFixed(2)}</span>
            </span>
          </div>
          <div class="dashed-line"></div>

          <!-- Financial Breakdown -->
          <table class="summary-table">
            <tbody>
              ${disc > 0 ? `
              <tr>
                <td>Discount Details (${order.discount || 0}%):</td>
                <td style="text-align: right;">-฿${disc.toFixed(2)}</td>
              </tr>` : ''}
              ${rounding > 0 ? `
              <tr>
                <td>Rounding:</td>
                <td style="text-align: right;">฿${rounding.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td>Sub Total:</td>
                <td style="text-align: right;">฿${subAfterDisc.toFixed(2)}</td>
              </tr>
              ${service > 0 ? `
              <tr>
                <td>Service Fee (${servicePct}%):</td>
                <td style="text-align: right;">+฿${service.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td>VAT (${taxPct}%):</td>
                <td style="text-align: right;">฿${tax.toFixed(2)}</td>
              </tr>
              <tr style="font-weight: 700;">
                <td>Amount Due:</td>
                <td style="text-align: right;">฿${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="dashed-line"></div>

          <!-- Payment Summary -->
          <div class="info-block" style="margin-top: 4px;">
            <div style="color: #444;">Payment Method:</div>
            <div class="info-row" style="margin-top: 2px;">
              <span class="bold">${paymentMethodName}</span>
              <span>฿${totalAmount.toFixed(2)}</span>
            </div>
            <div class="dashed-line" style="margin-top: 6px;"></div>
            <div class="paid-amount-row">
              <span>Paid Amount</span>
              <span>฿${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="dashed-line"></div>
          <div class="center" style="font-size: 11px; margin-top: 6px; color: #444;">
            Thank You, Visit Again!
          </div>
        </body>
      </html>
    `

    // Use native Electron silent printing to the OS default thermal printer
    if (window.api && typeof window.api.printThermalReceipt === 'function') {
      const res: any = await window.api.printThermalReceipt(htmlContent)
      console.log('Electron native thermal print result:', res)
      if (res && !res.success) {
        alert(
          `Print Error!\nTarget Printer: ${res.deviceName || 'Unknown Printer'}\nReason: ${
            res.reason || res.error || 'Failed to send print job'
          }`
        )
      }
      return
    }

    // Fallback for browser testing
    const printWindow = window.open('', '_blank', 'width=380,height=600')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(
        htmlContent +
          `<script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>`
      )
      printWindow.document.close()
    }
  } catch (err) {
    console.error('Failed to trigger automatic thermal print:', err)
  }
}
