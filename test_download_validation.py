import io
import csv
import json
import zipfile
import urllib.request
import urllib.error
import sys

API_BASE = "http://127.0.0.1:8000"

def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), resp.headers, resp.read()

def test_hr_500_employees():
    print("\n--- Test 1: generate hr data with 500 employees ---")
    status, _, spec_bytes = post_json(f"{API_BASE}/spec/infer", {"prompt": "generate hr data with 500 employees"})
    assert status == 200, f"Infer failed: {status}"
    spec = json.loads(spec_bytes.decode("utf-8"))
    
    status, _, gen_bytes = post_json(f"{API_BASE}/generate/relational", spec)
    assert status == 200, f"Relational gen failed: {status}"
    gen_data = json.loads(gen_bytes.decode("utf-8"))
    
    assert "employees" in gen_data["tables"], "employees table missing"
    emp_rows = gen_data["tables"]["employees"]["data"]
    assert len(emp_rows) == 500, f"Expected 500 rows, got {len(emp_rows)}"
    print(f"[OK] Backend generated {len(emp_rows)} employees in dataset.")

    # Export table to CSV
    status, headers, csv_bytes = post_json(f"{API_BASE}/export/table-csv", {
        "table_name": "employees",
        "rows": emp_rows
    })
    assert status == 200, f"Export CSV failed: {status}"

    # Check Content-Disposition header
    cd = headers.get("Content-Disposition", "")
    assert 'filename="employees.csv"' in cd, f"Unexpected Content-Disposition: {cd}"
    print(f"[OK] Content-Disposition header: {cd}")

    # Check UTF-8 BOM
    assert csv_bytes.startswith(b"\xef\xbb\xbf"), "Missing UTF-8 BOM prefix for Excel compatibility"
    print(f"[OK] UTF-8 BOM present at start of CSV.")

    # Parse CSV with standard csv reader
    csv_text = csv_bytes.decode("utf-8-sig")
    reader = list(csv.reader(io.StringIO(csv_text)))
    header = reader[0]
    data_rows = reader[1:]
    assert len(data_rows) == 500, f"Expected 500 data rows, got {len(data_rows)}"
    print(f"[OK] employees.csv parses perfectly: Header={header}, exactly {len(data_rows)} data rows.")

    # Check Proportionality (10 rows < 100 rows < 500 rows)
    _, _, csv_10 = post_json(f"{API_BASE}/export/table-csv", {"table_name": "employees", "rows": emp_rows[:10]})
    _, _, csv_100 = post_json(f"{API_BASE}/export/table-csv", {"table_name": "employees", "rows": emp_rows[:100]})
    size_10 = len(csv_10)
    size_100 = len(csv_100)
    size_500 = len(csv_bytes)
    assert size_10 < size_100 < size_500, f"File sizes not proportional: 10={size_10}, 100={size_100}, 500={size_500}"
    print(f"[OK] Proportional file size verified: 10 rows ({size_10} B) < 100 rows ({size_100} B) < 500 rows ({size_500} B).")

def test_hr_relation_and_all_downloads():
    print("\n--- Test 2: generate relation of hr -> All Download Types ---")
    status, _, spec_bytes = post_json(f"{API_BASE}/spec/infer", {"prompt": "generate relation of hr"})
    assert status == 200, f"Infer failed: {status}"
    spec = json.loads(spec_bytes.decode("utf-8"))
    
    status, _, gen_bytes = post_json(f"{API_BASE}/generate/relational", spec)
    assert status == 200, f"Relational gen failed: {status}"
    gen_data = json.loads(gen_bytes.decode("utf-8"))
    
    domain = gen_data.get("domain", "hr")
    tables_map = {t_name: t_obj["data"] for t_name, t_obj in gen_data["tables"].items()}
    print(f"[OK] Generated {domain} tables: {list(tables_map.keys())}")

    # 1. Test ZIP download
    status, headers, zip_bytes = post_json(f"{API_BASE}/export/tables-zip", {
        "domain": domain,
        "tables": tables_map
    })
    assert status == 200, f"ZIP export failed: {status}"
    cd = headers.get("Content-Disposition", "")
    assert f'filename="{domain}_tables.zip"' in cd, f"Unexpected ZIP Content-Disposition: {cd}"
    print(f"[OK] ZIP Content-Disposition: {cd}")

    # Validate ZIP content
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        namelist = zf.namelist()
        print(f"[OK] ZIP archive contains files: {namelist}")
        for t_name in tables_map.keys():
            expected_file = f"{t_name}.csv"
            assert expected_file in namelist, f"Missing {expected_file} in ZIP"
            t_csv = zf.read(expected_file).decode("utf-8-sig")
            parsed = list(csv.reader(io.StringIO(t_csv)))
            assert len(parsed) - 1 == len(tables_map[t_name]), f"Row count mismatch in zip {expected_file}"
    print(f"[OK] All {len(namelist)} CSVs in ZIP verified valid with correct row counts.")

    # 2. Test SQL Schema dump
    status, headers, sql_bytes = post_json(f"{API_BASE}/export/schema-sql", {
        "domain": domain,
        "tables": tables_map
    })
    assert status == 200, f"SQL export failed: {status}"
    cd = headers.get("Content-Disposition", "")
    assert f'filename="{domain}_schema.sql"' in cd, f"Unexpected SQL Content-Disposition: {cd}"
    sql_text = sql_bytes.decode("utf-8")
    assert "CREATE TABLE" in sql_text, "Missing CREATE TABLE statement in SQL schema"
    for t_name in tables_map.keys():
        assert f"CREATE TABLE {t_name}" in sql_text, f"Missing CREATE TABLE for {t_name}"
    print(f"[OK] SQL Schema verified valid with CREATE TABLE statements for all tables.")

    # 3. Test JSON data export
    status, headers, json_bytes = post_json(f"{API_BASE}/export/data-json", {
        "domain": domain,
        "data": tables_map
    })
    assert status == 200, f"JSON export failed: {status}"
    cd = headers.get("Content-Disposition", "")
    assert f'filename="{domain}_data.json"' in cd, f"Unexpected JSON Content-Disposition: {cd}"
    parsed_json = json.loads(json_bytes.decode("utf-8"))
    assert set(parsed_json.keys()) == set(tables_map.keys()), "JSON keys do not match tables"
    print(f"[OK] JSON Data export verified with identical keys and row structures.")

def test_empty_dataset_rejection():
    print("\n--- Test 3: Empty Dataset Rejection & Error Messages ---")
    endpoints = [
        (f"{API_BASE}/export/table-csv", {"table_name": "empty", "rows": []}),
        (f"{API_BASE}/export/tables-zip", {"domain": "empty", "tables": {}}),
        (f"{API_BASE}/export/schema-sql", {"domain": "empty", "tables": {}}),
        (f"{API_BASE}/export/data-json", {"domain": "empty", "data": {}}),
    ]

    for url, payload in endpoints:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as resp:
                assert False, f"Expected 400 error for {url}, got {resp.getcode()}"
        except urllib.error.HTTPError as err:
            assert err.code == 400, f"Expected 400, got {err.code}"
            body = json.loads(err.read().decode("utf-8"))
            assert "detail" in body and "empty" in body["detail"].lower(), f"Unexpected error detail: {body}"
            print(f"[OK] {url.split('/')[-1]} properly rejected empty payload with 400: '{body['detail']}'")

if __name__ == "__main__":
    try:
        test_hr_500_employees()
        test_hr_relation_and_all_downloads()
        test_empty_dataset_rejection()
        print("\n==========================================")
        print("ALL ACCEPTANCE & VALIDATION TESTS PASSED!")
        print("==========================================")
    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
