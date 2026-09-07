import { Order } from '../types'
import { store } from '../store/store'

export const printThermalReceipt = async (order: Order, _prepMins?: number): Promise<void> => {
  try {
    let itemsHtml = ''
    if (order.itemList && order.itemList.length > 0) {
      itemsHtml = order.itemList
        .map(
          (it) => `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 4px;">
            <span style="flex:1; padding-right: 8px;">${it.quantity}x ${it.name}</span>
            <span style="font-weight:600; white-space:nowrap;">฿${(it.price * it.quantity).toFixed(2)}</span>
          </div>`
        )
        .join('')
    } else {
      itemsHtml = (order.items || '')
        .split(', ')
        .filter(Boolean)
        .map(
          (it) => `
          <div style="display:flex; justify-content:space-between; margin-bottom: 3px;">
            <span>${it}</span>
          </div>`
        )
        .join('')
    }

    const dateStr = order.date || new Date().toLocaleString()

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Order Receipt - ${order.id}</title>
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
              font-size: 13.5px;
              line-height: 1.35;
            }
            .header {
              text-align: center;
              margin-bottom: 8px;
            }
            .title {
              font-size: 19px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sub {
              font-size: 12px;
              color: #333;
            }
            .divider {
              border-top: 1px dashed #333;
              margin: 8px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .bold {
              font-weight: bold;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
            }
            .footer {
              text-align: center;
              margin-top: 12px;
              font-size: 11.5px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ALADEEN RESTAURANT</div>
            <div class="sub">Bangkok, Thailand</div>
            <div class="sub">${order.type === 'POS' ? 'POS Receipt' : 'Online Order KOT / Receipt'}</div>
          </div>

          <div class="divider"></div>

          <div class="row"><span>Order ID:</span><span class="bold">${order.id}</span></div>
          <div class="row"><span>Date:</span><span>${dateStr}</span></div>
          <div class="row"><span>Type:</span><span class="bold">${(order.deliveryType || order.type || 'POS').toUpperCase()}</span></div>
          ${order.table ? `<div class="row"><span>Table:</span><span class="bold">${order.table}</span></div>` : ''}
          <div class="row"><span>Customer:</span><span>${order.customer}</span></div>
          ${order.customerPhone ? `<div class="row"><span>Phone:</span><span class="bold">${order.customerPhone}</span></div>` : ''}

          ${(order.deliveryType || '').toLowerCase() === 'delivery' && order.deliveryAddress ? `
          <div class="divider"></div>
          <div class="bold" style="color: #000; margin-bottom: 2px;">DELIVERY ADDRESS:</div>
          <div style="font-weight: 600; font-size: 12px; background: #f3f4f6; padding: 6px 8px; border-radius: 4px; border: 1px solid #e5e7eb; line-height: 1.35;">
            ${order.deliveryAddress}
          </div>
          ` : ''}

          <div class="divider"></div>

          <div class="bold" style="margin-bottom: 6px; display:flex; justify-content:space-between;">
            <span>ITEMS:</span>
            <span>PRICE</span>
          </div>
          <div>${itemsHtml}</div>

          ${order.orderNotes ? `
          <div class="divider"></div>
          <div class="bold" style="color: #000; margin-bottom: 2px;">SPECIAL INSTRUCTIONS:</div>
          <div style="font-weight: 600; font-size: 12px; background: #eee; padding: 4px 6px; border-radius: 4px;">${order.orderNotes}</div>
          ` : ''}

          <div class="divider"></div>

          ${(() => {
            const sub = order.subtotal !== undefined
              ? order.subtotal
              : (order.itemList && order.itemList.length > 0
                ? order.itemList.reduce((sum, item) => sum + item.price * item.quantity, 0)
                : order.amount)
            const disc = order.discountAmount !== undefined
              ? order.discountAmount
              : ((order.discount || 0) > 0 ? (sub * (order.discount || 0)) / 100 : 0)
            const subAfterDisc = sub - disc
            const servicePct = order.servicePercentage || 0
            const service = order.serviceFee !== undefined
              ? order.serviceFee
              : (servicePct > 0 ? (subAfterDisc * servicePct) / 100 : 0)
            const subAfterService = subAfterDisc + service
            const taxPct =
              order.taxPercentage !== undefined
                ? order.taxPercentage
                : (() => {
                    const state = store.getState()
                    const posVat = state.tableTabs?.posVatPercentage
                    return typeof posVat === 'number' ? posVat : 7
                  })()

            const tax = order.taxAmount !== undefined
              ? order.taxAmount
              : (subAfterService * (taxPct / 100))

            return `
              <div class="row"><span>Sub Total:</span><span>฿${sub.toFixed(2)}</span></div>
              ${disc > 0 ? `<div class="row"><span>Discount (${order.discount}%):</span><span>-฿${disc.toFixed(2)}</span></div>` : ''}
              ${service > 0 ? `<div class="row"><span>Service Fee${servicePct > 0 ? ` (${servicePct}%)` : ''}:</span><span>+฿${service.toFixed(2)}</span></div>` : ''}
              <div class="row"><span>Tax / VAT (${taxPct}%):</span><span>฿${tax.toFixed(2)}</span></div>
            `
          })()}

          <div class="divider"></div>

          <div class="row bold" style="font-size: 13px;">
            <span>TOTAL:</span>
            <span>฿${Number(order.amount).toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <div style="font-weight: 600; font-size: 13px; margin-top: 4px;">Thank You, Visit Again!</div>
          </div>
        </body>
      </html>
    `

    // Use native Electron silent printing to the OS default thermal printer
    if (window.api && typeof window.api.printThermalReceipt === 'function') {
      const res: any = await window.api.printThermalReceipt(htmlContent)
      console.log('Electron native thermal print result:', res)
      if (res && !res.success) {
        alert(`Print Error!\nTarget Printer: ${res.deviceName || 'Unknown Printer'}\nReason: ${res.reason || res.error || 'Failed to send print job'}`)
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
