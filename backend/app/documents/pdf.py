import io
from typing import Any, Dict, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class PDFDocumentRenderer:
    """Renders structured document dictionaries into professional PDF byte streams."""

    @classmethod
    def render_pdf(cls, doc: Dict[str, Any]) -> bytes:
        """Renders any supported document dictionary to PDF bytes."""
        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        doc_type = doc.get("doc_type", "Document")
        styles = getSampleStyleSheet()

        # Custom text styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a")
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b")
        )

        header_right = ParagraphStyle(
            "HeaderRight",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            alignment=2,
            textColor=colors.HexColor("#059669")
        )

        body_bold = ParagraphStyle(
            "BodyBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1e293b")
        )

        body_normal = ParagraphStyle(
            "BodyNormal",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )

        elements = []

        # 1. Header Section
        header_data = [
            [
                Paragraph(f"<b>{doc_type.upper()}</b>", title_style),
                Paragraph(doc.get("institution") or doc.get("issuer", {}).get("company") or doc.get("laboratory", {}).get("name") or doc.get("hospital") or "SYNTHETIC PLATFORM CORP", header_right)
            ],
            [
                Paragraph(f"Doc Reference: {doc.get('doc_id', 'DOC-001')} • {doc.get('statement_period') or doc.get('invoice_date') or doc.get('collected_date') or '2025-08-15'}", subtitle_style),
                Paragraph("100% Grounded Synthetic Record", ParagraphStyle("SubRight", parent=subtitle_style, alignment=2))
            ]
        ]
        t_header = Table(header_data, colWidths=[320, 220])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        elements.append(t_header)
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceBefore=2, spaceAfter=14))

        # 2. Recipient / Patient / Customer Section
        info_lines = []
        if "customer" in doc:
            c = doc["customer"]
            info_lines.append(f"<b>Client:</b> {c.get('name')} (ID: {c.get('id')}) | {c.get('email')} | {c.get('phone', '')}")
        elif "patient" in doc:
            p = doc["patient"]
            info_lines.append(f"<b>Patient:</b> {p.get('name')} (ID: {p.get('id')}) | Gender: {p.get('gender', 'N/A')} | DOB: {p.get('dob', '1980-01-01')}")
            if "ordering_physician" in p:
                info_lines.append(f"<b>Physician:</b> {p.get('ordering_physician')}")
        elif "client" in doc:
            cl = doc["client"]
            info_lines.append(f"<b>Billed To:</b> {cl.get('name')} (ID: {cl.get('id')}) | {cl.get('email')}")

        if "account" in doc:
            acc = doc["account"]
            info_lines.append(f"<b>Account:</b> {acc.get('number')} ({acc.get('type')}) | Currency: {acc.get('currency', 'USD')} | Opening Balance: ${acc.get('opening_balance', 0):,.2f}")

        for line in info_lines:
            elements.append(Paragraph(line, body_normal))
        elements.append(Spacer(1, 12))

        # 3. Tables (Transactions, Items, or Lab Tests)
        if "transactions" in doc:
            tx_data = [["Date", "Description", "Type", "Amount", "Running Balance"]]
            for tx in doc["transactions"]:
                tx_data.append([
                    tx.get("date", ""),
                    tx.get("description", ""),
                    tx.get("type", ""),
                    f"${tx.get('amount', 0):,.2f}",
                    f"${tx.get('running_balance', 0):,.2f}"
                ])
            t_tx = Table(tx_data, colWidths=[70, 240, 60, 80, 90])
            t_tx.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0f172a")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            elements.append(t_tx)

        elif "items" in doc:
            item_data = [["Description", "Qty", "Unit Price", "Total Amount"]]
            for it in doc["items"]:
                item_data.append([
                    it.get("description", ""),
                    str(it.get("quantity", 1)),
                    f"${it.get('unit_price', 0):,.2f}",
                    f"${it.get('amount', 0):,.2f}"
                ])
            t_items = Table(item_data, colWidths=[290, 50, 100, 100])
            t_items.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0f172a")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('ALIGN', (1,0), (1,-1), 'CENTER'),
                ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            elements.append(t_items)

        elif "tests" in doc:
            test_data = [["Laboratory Parameter", "Observed Result", "Reference Range", "Status"]]
            for ts in doc["tests"]:
                test_data.append([
                    ts.get("name", ""),
                    f"{ts.get('val')} {ts.get('unit', '')}",
                    ts.get("range", ""),
                    ts.get("status", "Normal")
                ])
            t_lab = Table(test_data, colWidths=[220, 120, 120, 80])
            t_lab.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0f172a")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('ALIGN', (1,0), (-1,-1), 'CENTER'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            elements.append(t_lab)

        # 4. Financial Summary / Reconciled Invariants
        elements.append(Spacer(1, 14))
        if "financials" in doc:
            fin = doc["financials"]
            fin_data = [
                ["Subtotal:", f"${fin.get('subtotal', 0):,.2f}"],
                [f"Tax ({fin.get('tax_rate_percent', 8)}%):", f"${fin.get('tax_amount', 0):,.2f}"],
                ["Grand Total Reconciled:", f"${fin.get('grand_total', 0):,.2f}"]
            ]
            t_fin = Table(fin_data, colWidths=[140, 90], hAlign="RIGHT")
            t_fin.setStyle(TableStyle([
                ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
                ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor("#0f172a")),
            ]))
            elements.append(t_fin)

        elif "account" in doc and doc["account"].get("closing_balance") is not None:
            acc = doc["account"]
            bal_data = [
                ["Opening Balance:", f"${acc.get('opening_balance', 0):,.2f}"],
                ["Total Credits (+):", f"${acc.get('total_credits', 0):,.2f}"],
                ["Total Debits (-):", f"${acc.get('total_debits', 0):,.2f}"],
                ["Closing Reconciled Balance:", f"${acc.get('closing_balance', 0):,.2f}"]
            ]
            t_bal = Table(bal_data, colWidths=[180, 90], hAlign="RIGHT")
            t_bal.setStyle(TableStyle([
                ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
                ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor("#0f172a")),
            ]))
            elements.append(t_bal)

        # 5. Build PDF
        pdf.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
