import { Order } from '../types'

export const printThermalReceipt = async (order: Order, _prepMins?: number): Promise<void> => {
  try {
    const itemsHtml = (order.items || '')
      .split(', ')
      .filter(Boolean)
      .map((it) => `<div style="display:flex; justify-content:space-between; margin-bottom: 3px;"><span>${it}</span></div>`)
      .join('')

    const dateStr = order.date || new Date().toLocaleString()

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Order Receipt - ${order.id}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              max-width: 420px;
              margin: 0 auto;
              padding: 16px;
              color: #111;
              font-size: 13px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 12px;
            }
            .title {
              font-size: 18px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sub {
              font-size: 12px;
              color: #444;
            }
            .divider {
              border-top: 1px dashed #666;
              margin: 10px 0;
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
              margin-top: 14px;
              font-size: 12px;
              color: #444;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ALADEEN RESTAURANT</div>
            <div class="sub">Bangkok, Thailand</div>
            <div class="sub">Online Order KOT / Receipt</div>
          </div>

          <div class="divider"></div>

          <div class="row"><span>Ticket No:</span><span class="bold">${order.id}</span></div>
          <div class="row"><span>Date:</span><span>${dateStr}</span></div>
          <div class="row"><span>Type:</span><span class="bold">${(order.deliveryType || order.type || 'Online').toUpperCase()}</span></div>
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

          <div class="bold" style="margin-bottom: 4px;">ORDER ITEMS:</div>
          <div>${itemsHtml}</div>

          ${order.orderNotes ? `
          <div class="divider"></div>
          <div class="bold" style="color: #000; margin-bottom: 2px;">SPECIAL INSTRUCTIONS:</div>
          <div style="font-weight: 600; font-size: 12px; background: #eee; padding: 4px 6px; border-radius: 4px;">${order.orderNotes}</div>
          ` : ''}

          <div class="divider"></div>

          <div class="row bold" style="font-size: 13px;">
            <span>TOTAL:</span>
            <span>฿${Number(order.amount).toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <div>*** Order Confirmed & In Kitchen ***</div>
            <div>Thank You!</div>
          </div>
        </body>
      </html>
    `

    // Use native Electron silent printing to the OS default thermal printer
    if (window.api && typeof window.api.printThermalReceipt === 'function') {
      const res: any = await window.api.printThermalReceipt(htmlContent)
      console.log('Electron native thermal print result:', res)
      if (res && res.success) {
        alert(`Print Success!\nTicket sent to thermal printer: ${res.deviceName || 'System Printer'}`)
      } else if (res) {
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
