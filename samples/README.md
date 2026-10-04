# Sample Datasets & Export Artifacts

This directory contains representative samples and testing data for the CLOAKDATA platform:

### 1. Tabular & Relational Testing Datasets
- **`tips.csv`**: Classic benchmark tabular dataset suitable for testing the CSV profiler, automatic distribution fitting, and schema inference.
- **`sql_result_bank_statements.csv`**: Exported synthetic financial ledger transactions demonstrating running balance reconciliation and transaction categorization.
- **`retail_db_schema_and_relations.sql`**: Exported relational database DDL/DML script with 100% foreign key integrity (zero orphan guarantee) between `customers`, `products`, `orders`, and `order_items`.

### 2. Sample Grounded PDF Documents
- **`sample_bank_statement.pdf`**: Generated bank statement with verified running balances (Opening Balance + Credits − Debits == Closing Balance).
- **`sample_tax_invoice.pdf`**: Commercial invoice with exact line-item math and tax computation.
- **`sample_lab_report.pdf`**: Clinical laboratory report with physiological reference ranges and out-of-range flags.
- **`sample_discharge_summary.pdf`**: Hospital inpatient discharge summary with grounded ICD-10 diagnosis and medication timeline.
