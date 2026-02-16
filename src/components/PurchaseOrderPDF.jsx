import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const C = {
  primary:      '#1e40af',
  primaryLight: '#dbeafe',
  primaryDark:  '#1e3a8a',
  gray50:       '#f9fafb',
  gray100:      '#f3f4f6',
  gray200:      '#e5e7eb',
  gray400:      '#9ca3af',
  gray600:      '#4b5563',
  gray700:      '#374151',
  gray900:      '#111827',
  green:        '#166534',
  greenLight:   '#dcfce7',
  greenBorder:  '#bbf7d0',
  white:        '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.gray900,
    paddingTop: 36,
    paddingBottom: 56,   // room for footer
    paddingHorizontal: 36,
    backgroundColor: C.white,
  },

  // ── HEADER ──────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 2,
  },
  companyTagline: { fontSize: 8, color: C.gray400 },
  docTitleBlock: { alignItems: 'flex-end' },
  docTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 3,
  },
  poNumber: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.gray700,
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── INVOICE BANNER ───────────────────────
  invoiceBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: C.greenLight,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.greenBorder,
    gap: 16,
  },
  bannerField: { flexDirection: 'row', alignItems: 'center' },
  bannerLabel: { fontSize: 8, color: C.green, fontFamily: 'Helvetica-Bold', marginRight: 4 },
  bannerValue: { fontSize: 8, color: C.green },

  // ── INFO BOXES ───────────────────────────
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  infoBox: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  infoBoxTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 7,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  infoLine: { flexDirection: 'row', marginBottom: 4 },
  infoLabel: { fontSize: 8, color: C.gray400, width: 76 },
  infoValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray700, flex: 1 },

  // ── TABLE ────────────────────────────────
  tableSection: { marginBottom: 14 },
  tableSectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  thCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  tableRowAlt: { backgroundColor: C.gray50 },

  // Each cell is a View (not Text) so content wraps correctly
  tdCell: { justifyContent: 'flex-start' },
  tdText: { fontSize: 8, color: C.gray700 },
  tdSub:  { fontSize: 7, color: C.gray400, marginTop: 1 },
  tdBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray700 },
  tdRight:{ textAlign: 'right' },

  // Column proportions (applied to View wrappers)
  colMaterial: { flex: 3.5 },
  colQty:      { flex: 1.5 },
  colPrice:    { flex: 1.4 },
  colStorage:  { flex: 2.2 },
  colTotal:    { flex: 1.6 },

  // item notes row
  itemNotes: {
    paddingLeft: 8,
    paddingBottom: 5,
    fontSize: 7,
    color: C.gray400,
    fontStyle: 'italic',
  },

  // ── TOTAL ────────────────────────────────
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.primary,
  },
  totalLabel:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.primary, marginRight: 12 },
  totalAmount: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.primary },

  // ── NOTES ────────────────────────────────
  notesBox: {
    marginTop: 14,
    padding: 10,
    backgroundColor: C.gray50,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  notesTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.gray700,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: { fontSize: 8, color: C.gray700 },

  // ── FOOTER ───────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.gray400 },
});

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtINR = (n) => {
  if (n == null || isNaN(n)) return '₹0.00';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const STATUS_STYLE = {
  draft:     { backgroundColor: '#f3f4f6', color: '#374151' },
  ordered:   { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  received:  { backgroundColor: '#dcfce7', color: '#166534' },
  cancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

const PurchaseOrderPDF = ({ order }) => {
  const supplier   = order.supplierId || {};
  const status     = order.status || 'draft';
  const statusSty  = STATUS_STYLE[status] || STATUS_STYLE.draft;

  return (
    <Document title={`PO — ${order.poNumber}`} author="SS Cable Industries">
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>SS Cable Industries</Text>
            <Text style={styles.companyTagline}>Raw Material Inventory Management</Text>
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>PURCHASE ORDER</Text>
            <Text style={styles.poNumber}>{order.poNumber}</Text>
            <Text style={[styles.statusPill, statusSty]}>{status}</Text>
          </View>
        </View>

        {/* ── INVOICE BANNER ── */}
        {order.invoiceNumber && (
          <View style={styles.invoiceBanner}>
            <View style={styles.bannerField}>
              <Text style={styles.bannerLabel}>Invoice No:</Text>
              <Text style={styles.bannerValue}>{order.invoiceNumber}</Text>
            </View>
            {order.invoiceDate && (
              <View style={styles.bannerField}>
                <Text style={styles.bannerLabel}>Invoice Date:</Text>
                <Text style={styles.bannerValue}>{fmtDate(order.invoiceDate)}</Text>
              </View>
            )}
            {order.receivedAt && (
              <View style={styles.bannerField}>
                <Text style={styles.bannerLabel}>Received On:</Text>
                <Text style={styles.bannerValue}>{fmtDate(order.receivedAt)}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── INFO BOXES ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Supplier</Text>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{supplier.supplierName || '—'}</Text>
            </View>
            {supplier.contactPerson && (
              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{supplier.contactPerson}</Text>
              </View>
            )}
            {supplier.phone && (
              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{supplier.phone}</Text>
              </View>
            )}
            {supplier.email && (
              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{supplier.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Order Details</Text>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>PO Number</Text>
              <Text style={styles.infoValue}>{order.poNumber}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{fmtDate(order.orderDate)}</Text>
            </View>
            {order.expectedDeliveryDate && (
              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Expected By</Text>
                <Text style={styles.infoValue}>{fmtDate(order.expectedDeliveryDate)}</Text>
              </View>
            )}
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Total Items</Text>
              <Text style={styles.infoValue}>{order.items?.length || 0}</Text>
            </View>
          </View>
        </View>

        {/* ── ITEMS TABLE ── */}
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Order Items</Text>

          {/* Header row */}
          <View style={styles.tableHeader}>
            <View style={styles.colMaterial}>
              <Text style={styles.thCell}>Material</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.thCell, { textAlign: 'right' }]}>Quantity</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={[styles.thCell, { textAlign: 'right' }]}>Rate</Text>
            </View>
            <View style={styles.colStorage}>
              <Text style={styles.thCell}>Storage</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={[styles.thCell, { textAlign: 'right' }]}>Amount</Text>
            </View>
          </View>

          {/* Data rows */}
          {(order.items || []).map((item, idx) => {
            const matName  = item.materialId?.name || '—';
            const matDims  = item.materialId?.specifications?.dimensions;
            const qtyText  = item.quantity?.weight > 0
              ? `${item.quantity.weight} kg`
              : item.quantity?.length > 0
                ? `${item.quantity.length} m`
                : '—';
            const rateText = item.pricing?.pricePerKg > 0
              ? `${fmtINR(item.pricing.pricePerKg)}/kg`
              : '—';
            const storageLoc    = item.storage?.location || '';
            const storageDetail = item.storage?.locationDetails || '';

            return (
              <View key={idx}>
                <View style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>

                  {/* Material + optional dimensions */}
                  <View style={[styles.tdCell, styles.colMaterial]}>
                    <Text style={styles.tdText}>{matName}</Text>
                    {matDims && <Text style={styles.tdSub}>{matDims}</Text>}
                  </View>

                  {/* Quantity */}
                  <View style={[styles.tdCell, styles.colQty]}>
                    <Text style={[styles.tdText, styles.tdRight]}>{qtyText}</Text>
                  </View>

                  {/* Rate */}
                  <View style={[styles.tdCell, styles.colPrice]}>
                    <Text style={[styles.tdText, styles.tdRight]}>{rateText}</Text>
                  </View>

                  {/* Storage — location on one line, detail on sub-line */}
                  <View style={[styles.tdCell, styles.colStorage]}>
                    {storageLoc
                      ? <>
                          <Text style={[styles.tdText, { textTransform: 'capitalize' }]}>{storageLoc}</Text>
                          {storageDetail && <Text style={styles.tdSub}>{storageDetail}</Text>}
                        </>
                      : <Text style={styles.tdText}>—</Text>
                    }
                  </View>

                  {/* Total */}
                  <View style={[styles.tdCell, styles.colTotal]}>
                    <Text style={[styles.tdBold, styles.tdRight]}>{fmtINR(item.pricing?.totalCost)}</Text>
                  </View>

                </View>

                {item.notes && (
                  <Text style={styles.itemNotes}>↳ {item.notes}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ── GRAND TOTAL ── */}
        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalAmount}>{fmtINR(order.totalAmount)}</Text>
          </View>
        </View>

        {/* ── NOTES ── */}
        {order.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SS Cable Industries · Inventory Management System</Text>
          <Text style={styles.footerText}>
            Generated {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default PurchaseOrderPDF;
