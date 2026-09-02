import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { DocumentContent } from "@/types";
import { computeTotals, type BillingSettings } from "@/lib/billing";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 20,
  },
  company: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  address: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  meta: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  metaValue: {
    fontWeight: "bold",
    fontSize: 10,
    marginBottom: 4,
    color: "#2563eb",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
  },
  clientSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  itemsTable: {
    marginBottom: 24,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  cellDesc: {
    flex: 6,
    fontSize: 9,
    color: "#444",
  },
  cellQty: {
    flex: 1,
    fontSize: 9,
    color: "#444",
    textAlign: "center",
  },
  cellPrice: {
    flex: 2,
    fontSize: 9,
    color: "#444",
    textAlign: "right",
  },
  cellTotal: {
    flex: 2,
    fontSize: 9,
    color: "#444",
    textAlign: "right",
  },
  cellLabel: {
    flex: 6,
    fontSize: 9,
    color: "#999",
  },
  totals: {
    marginLeft: "auto",
    width: 220,
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalsValue: {
    fontSize: 10,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  grandTotalText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 10,
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 10,
    color: "#444",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
  },
});

/** Render a single document to PDF, honoring brand/white-label/tax settings. */
export function DocumentPDF({
  content,
  settings,
}: {
  content: DocumentContent;
  settings: BillingSettings;
}) {
  const accent = settings.brand?.accent_color || "#2563eb";
  const wl = settings.whiteLabel;
  const hideBranding = wl?.active && wl.hide_branding;
  const currency = "USD";
  const rawTotal = content.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const totals = computeTotals(rawTotal, settings);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.company, { color: accent }]}>{content.header.company_name}</Text>
            <Text style={styles.address}>{content.header.company_address}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>Document №</Text>
            <Text style={[styles.metaValue, { color: accent }]}>{content.header.number}</Text>
            <Text style={styles.metaText}>Date</Text>
            <Text style={styles.metaValue}>{content.header.date}</Text>
          </View>
        </View>

        <Text style={styles.title}>{content.header.client_name}</Text>

        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Billed To</Text>
          <Text style={styles.company}>{content.header.client_name}</Text>
          {content.header.client_address && (
            <Text style={styles.address}>{content.header.client_address}</Text>
          )}
        </View>

        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDesc}>Description</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Price</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>
          {content.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.cellDesc}>{item.description}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>
                {currency}
                {Number(item.unit_price).toFixed(2)}
              </Text>
              <Text style={styles.cellTotal}>
                {currency}
                {(item.quantity * item.unit_price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.cellLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {currency}
              {totals.subtotal.toFixed(2)}
            </Text>
          </View>
          {totals.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.cellLabel}>
                {totals.taxLabel} ({totals.taxRate}%)
              </Text>
              <Text style={styles.totalsValue}>
                {currency}
                {totals.taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>Total</Text>
            <Text style={[styles.grandTotalText, { color: accent }]}>
              {currency}
              {totals.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {content.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{content.notes}</Text>
          </View>
        )}

        {content.terms && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{content.terms}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>{hideBranding ? "" : "Generated with InvoiceCraft"}</Text>
          <Text>
            {content.header.company_name} • {new Date().getFullYear()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Render a single document and return its PDF bytes. */
export async function renderDocumentPDF(
  content: DocumentContent,
  settings: BillingSettings
): Promise<Buffer> {
  const blob = await pdf(<DocumentPDF content={content} settings={settings} />).toBlob();
  return Buffer.from(new Uint8Array(await blob.arrayBuffer()));
}