# backend/routes/export.py - FULL WORKING VERSION (normal horizontal Excel)

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging
import io
import csv
import json
import re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from mongodb.database import get_database
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/export", tags=["Export"])


# ============================================================
# MODELS
# ============================================================

class ExportRequest(BaseModel):
    job_id: str
    format: str
    include_metadata: bool = True

class BulkExportRequest(BaseModel):
    job_ids: List[str]
    format: str
    include_metadata: bool = True

class PreviewRequest(BaseModel):
    limit: int = 10


# ============================================================
# PARSERS
# ============================================================

def _try_json(value):
    if not isinstance(value, str):
        return value, True
    s = value.strip()
    if not s or s[0] not in "[{":
        return None, False
    try:
        return json.loads(s), True
    except (json.JSONDecodeError, ValueError):
        return None, False


def _parse_markdown_table(text: str):
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    sep_idx = None
    for i, ln in enumerate(lines):
        if re.match(r"^\|?[\s:\-|]+\|[\s:\-|]+$", ln) and "-" in ln:
            sep_idx = i
            break
    if sep_idx is None or sep_idx == 0:
        return None

    def split_row(ln):
        ln = ln.strip()
        if ln.startswith("|"):
            ln = ln[1:]
        if ln.endswith("|"):
            ln = ln[:-1]
        return [c.strip() for c in ln.split("|")]

    headers = split_row(lines[sep_idx - 1])
    rows = []
    for ln in lines[sep_idx + 1:]:
        cells = split_row(ln)
        if not cells or all(c == "" for c in cells):
            continue
        if len(cells) < len(headers):
            cells += [""] * (len(headers) - len(cells))
        rows.append(dict(zip(headers, cells[: len(headers)])))
    return rows or None


def _parse_delimited(text: str):
    lines = [ln for ln in text.strip().splitlines() if ln.strip()]
    if len(lines) < 2:
        return None

    for delim in ("\t", ","):
        if delim not in lines[0]:
            continue
        try:
            reader = csv.reader(io.StringIO(text), delimiter=delim)
            rows = list(reader)
        except Exception:
            continue
        if len(rows) < 2:
            continue
        headers = [h.strip() for h in rows[0]]
        data_rows = [
            r for r in rows[1:]
            if not all(re.match(r"^[\s:\-]*$", c or "") for c in r)
        ]
        out = []
        for r in data_rows:
            if len(r) < len(headers):
                r = r + [""] * (len(headers) - len(r))
            out.append({headers[i]: (r[i] or "").strip() for i in range(len(headers))})
        if out:
            return out
    return None


def _expand_parallel_lists(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Zip parallel list columns into one row per element."""
    if not isinstance(record, dict):
        return [record]

    list_keys = [k for k, v in record.items() if isinstance(v, list)]
    if not list_keys:
        return [record]

    non_empty_lists = [k for k in list_keys if len(record[k]) > 0]
    if not non_empty_lists:
        return [record]

    n_rows = max(len(record[k]) for k in non_empty_lists)
    scalar_keys = [k for k in record.keys() if k not in list_keys]

    expanded: List[Dict[str, Any]] = []
    for i in range(n_rows):
        row: Dict[str, Any] = {}
        for k in scalar_keys:
            row[k] = record[k]
        for k in list_keys:
            lst = record[k]
            row[k] = lst[i] if isinstance(lst, list) and i < len(lst) else (None if isinstance(lst, list) else lst)

        list_vals = [row[k] for k in list_keys]
        if all(v in (None, "", []) for v in list_vals):
            continue

        expanded.append(row)

    return expanded if expanded else [record]


def _records_from_any(value):
    parsed, ok = _try_json(value)
    if ok and parsed is not None:
        value = parsed

    if isinstance(value, dict):
        for key in ("data", "results", "items", "records", "rows"):
            if isinstance(value.get(key), list):
                value = value[key]
                break

    if isinstance(value, list):
        out = []
        for item in value:
            if isinstance(item, dict):
                out.extend(_expand_parallel_lists(item))
            elif isinstance(item, (list, tuple)):
                out.append({f"col_{i+1}": v for i, v in enumerate(item)})
            else:
                out.append({"value": item})
        return out

    if isinstance(value, dict):
        return _expand_parallel_lists(value)

    if isinstance(value, str):
        md = _parse_markdown_table(value)
        if md:
            return md
        dl = _parse_delimited(value)
        if dl:
            return dl
        return [{"value": value.strip()}] if value.strip() else []

    if value is None:
        return []
    return [{"value": value}]


# ============================================================
# NORMALIZATION / DATASET
# ============================================================

def normalize_record(record: Dict[str, Any]) -> Dict[str, Any]:
    flat = {}
    for key, value in record.items():
        if key == "_id":
            continue
        if value is None:
            flat[key] = ""
        elif isinstance(value, (dict, list)):
            flat[key] = json.dumps(value, ensure_ascii=False, default=str)
        elif isinstance(value, datetime):
            flat[key] = value.isoformat()
        else:
            flat[key] = value
    return flat


def build_dataset(parsed_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    dataset: List[Dict[str, Any]] = []

    for result in parsed_results:
        content = result.get("parsed_content")
        parsed, ok = _try_json(content)
        if ok and parsed is not None:
            content = parsed

        rows = _records_from_any(content)

        extras = {}
        created = result.get("created_at")
        if created is not None:
            extras["created_at"] = created.isoformat() if isinstance(created, datetime) else str(created)

        for row in rows:
            if not isinstance(row, dict):
                row = {"value": row}
            merged = {**extras, **row}
            dataset.append(normalize_record(merged))

    return dataset


def collect_fields(records: List[Dict[str, Any]]) -> List[str]:
    fields = []
    seen = set()
    for record in records:
        for key in record.keys():
            if key not in seen:
                seen.add(key)
                fields.append(key)
    return fields


# ============================================================
# GENERATORS
# ============================================================

def generate_csv(dataset: List[Dict[str, Any]], filename: str) -> StreamingResponse:
    if not dataset:
        raise HTTPException(status_code=400, detail="No data to export")

    fields = collect_fields(dataset)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, restval="", extrasaction="ignore")
    writer.writeheader()
    for row in dataset:
        writer.writerow({f: row.get(f, "") for f in fields})

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
    )


def generate_excel(dataset: List[Dict[str, Any]], filename: str) -> StreamingResponse:
    """
    NORMAL (horizontal) Excel:
      - One row per record
      - One column per field
      - Header row frozen at top
    """
    if not dataset:
        raise HTTPException(status_code=400, detail="No data to export")

    fields = collect_fields(dataset)

    wb = Workbook()
    ws = wb.active
    ws.title = "Dataset"

    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="00ED64", end_color="00ED64", fill_type="solid")
    header_align = Alignment(horizontal="center", vertical="center")

    # ---- Header row ----
    for col_idx, field in enumerate(fields, 1):
        cell = ws.cell(row=1, column=col_idx, value=field)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align

    # ---- Data rows ----
    for row_idx, row in enumerate(dataset, 2):
        for col_idx, field in enumerate(fields, 1):
            value = row.get(field, "")
            if isinstance(value, str) and len(value) > 32767:
                value = value[:32767]
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.alignment = Alignment(wrap_text=True, vertical="top")

    # ---- Auto-fit column widths ----
    for col_idx, field in enumerate(fields, 1):
        max_len = len(str(field))
        for row_idx in range(2, min(len(dataset) + 2, 100)):
            val = ws.cell(row=row_idx, column=col_idx).value
            if val is not None:
                max_len = max(max_len, len(str(val)))
        ws.column_dimensions[get_column_letter(col_idx)].width = min(max_len + 2, 50)

    # ---- Freeze header row ----
    ws.freeze_panes = "A2"

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
    )


def generate_json(dataset: List[Dict[str, Any]], filename: str) -> StreamingResponse:
    if not dataset:
        raise HTTPException(status_code=400, detail="No data to export")

    output_data = {
        "metadata": {
            "export_timestamp": datetime.now().isoformat(),
            "total_records": len(dataset),
            "fields": collect_fields(dataset),
        },
        "data": dataset,
    }

    output = io.BytesIO()
    output.write(json.dumps(output_data, indent=2, ensure_ascii=False, default=str).encode("utf-8"))
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
    )


def build_response(dataset: List[Dict[str, Any]], filename: str, fmt: str) -> StreamingResponse:
    fmt = (fmt or "").lower()
    if fmt == "csv":
        return generate_csv(dataset, filename)
    if fmt in ("excel", "xlsx"):
        return generate_excel(dataset, filename)
    if fmt == "json":
        return generate_json(dataset, filename)
    raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")


# ============================================================
# DEBUG
# ============================================================

@router.get("/debug/{job_id}")
async def debug_job(job_id: str, current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    results = [r async for r in db.parsed_results.find({"job_id": ObjectId(job_id)}).limit(3)]

    samples = []
    for r in results:
        r["_id"] = str(r["_id"])
        if "job_id" in r:
            r["job_id"] = str(r["job_id"])
        if "created_at" in r and isinstance(r["created_at"], datetime):
            r["created_at"] = r["created_at"].isoformat()

        raw = r.get("parsed_content")
        parsed_rows = _records_from_any(raw)
        samples.append({
            "raw_type": type(raw).__name__,
            "raw_preview": (str(raw)[:800] if raw is not None else None),
            "parsed_row_count": len(parsed_rows),
            "parsed_rows_preview": parsed_rows[:3],
        })

    all_results = [r async for r in db.parsed_results.find({"job_id": ObjectId(job_id)})]
    dataset = build_dataset(all_results)
    fields = collect_fields(dataset)

    return {
        "job_id": job_id,
        "total_parsed_results": len(all_results),
        "total_dataset_rows": len(dataset),
        "final_fields": fields,
        "final_dataset_preview": dataset[:5],
        "raw_samples": samples,
    }


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/jobs-with-results")
async def get_jobs_with_results(current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))

    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$lookup": {
            "from": "parsed_results",
            "localField": "_id",
            "foreignField": "job_id",
            "as": "parsed_results",
        }},
        {"$match": {"parsed_results": {"$ne": []}}},
        {"$project": {
            "name": 1, "url": 1, "status": 1, "created_at": 1,
            "parsed_count": {"$size": "$parsed_results"},
        }},
        {"$sort": {"created_at": -1}},
    ]

    jobs = []
    async for job in db.jobs.aggregate(pipeline):
        jobs.append({
            "id": str(job["_id"]),
            "name": job.get("name", ""),
            "url": job.get("url", ""),
            "status": job.get("status", ""),
            "created_at": job.get("created_at").isoformat() if job.get("created_at") else None,
            "parsed_count": job.get("parsed_count", 0),
        })

    return {"jobs": jobs}


@router.post("/preview/{job_id}")
async def preview_export(
    job_id: str,
    request: PreviewRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await db.jobs.find_one({"_id": ObjectId(job_id), "user_id": user_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).limit(request.limit)
    parsed_results = [r async for r in cursor]

    if not parsed_results:
        raise HTTPException(status_code=404, detail="No parsed results found")

    dataset = build_dataset(parsed_results)
    fields = collect_fields(dataset)
    total_available = await db.parsed_results.count_documents({"job_id": ObjectId(job_id)})

    return {
        "job_id": job_id,
        "job_name": job.get("name"),
        "preview": dataset,
        "fields": fields,
        "total_available": total_available,
        "preview_limit": request.limit,
    }


@router.post("/generate")
async def generate_export(
    request: ExportRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))

    if not ObjectId.is_valid(request.job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await db.jobs.find_one({"_id": ObjectId(request.job_id), "user_id": user_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cursor = db.parsed_results.find({"job_id": ObjectId(request.job_id)})
    parsed_results = [r async for r in cursor]

    if not parsed_results:
        raise HTTPException(status_code=404, detail="No parsed results found")

    dataset = build_dataset(parsed_results)
    if not dataset:
        raise HTTPException(status_code=400, detail="Parsed results contained no extractable rows")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    job_name = re.sub(r"[^A-Za-z0-9_\-]+", "_", (job.get("name") or "export"))[:40]
    filename = f"{job_name}_{timestamp}"

    return build_response(dataset, filename, request.format)


@router.post("/bulk")
async def bulk_export(
    request: BulkExportRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))

    all_dataset: List[Dict[str, Any]] = []

    for job_id in request.job_ids:
        if not ObjectId.is_valid(job_id):
            continue
        job = await db.jobs.find_one({"_id": ObjectId(job_id), "user_id": user_id})
        if not job:
            continue

        cursor = db.parsed_results.find({"job_id": ObjectId(job_id)})
        parsed_results = [r async for r in cursor]
        all_dataset.extend(build_dataset(parsed_results))

    if not all_dataset:
        raise HTTPException(status_code=404, detail="No data found for selected jobs")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"bulk_{len(request.job_ids)}jobs_{timestamp}"

    return build_response(all_dataset, filename, request.format)


@router.get("/stats/{job_id}")
async def get_export_stats(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await db.jobs.find_one({"_id": ObjectId(job_id), "user_id": user_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)})
    parsed_results = [r async for r in cursor]

    if not parsed_results:
        raise HTTPException(status_code=404, detail="No parsed results found")

    dataset = build_dataset(parsed_results)
    fields = collect_fields(dataset)

    return {
        "job_name": job.get("name"),
        "job_url": job.get("url"),
        "total_parsed_records": len(parsed_results),
        "total_rows": len(dataset),
        "fields": fields,
        "available_formats": ["csv", "excel", "json"],
        "last_parsed_date": (
            parsed_results[0].get("created_at").isoformat()
            if parsed_results[0].get("created_at")
            else None
        ),
    }