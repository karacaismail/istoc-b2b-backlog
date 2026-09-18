#!/usr/bin/env python3
"""Create a publish-safe, planning-enriched view of the canonical backlog."""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "istoc-backlog" / "istoc-backlog.json"
OUTPUT = ROOT / "backlog-site" / "public" / "data" / "backlog.json"

SET_BASE = {
    "SET-001": 94, "SET-002": 63, "SET-003": 92, "SET-004": 82, "SET-005": 91,
    "SET-006": 95, "SET-007": 75, "SET-008": 77, "SET-009": 70, "SET-010": 72,
    "SET-011": 68, "SET-012": 67, "SET-013": 86, "SET-014": 45, "SET-015": 73,
    "SET-016": 61, "SET-017": 94, "SET-018": 83, "SET-019": 96, "SET-020": 66,
    "SET-021": 88, "SET-022": 84, "SET-023": 65, "SET-024": 84, "SET-025": 70,
    "SET-026": 66, "SET-027": 79, "SET-028": 96, "SET-029": 70, "SET-030": 85,
    "SET-031": 98, "SET-032": 56, "SET-033": 92, "SET-034": 97, "SET-035": 93,
    "SET-036": 58, "SET-037": 90, "SET-038": 89, "SET-039": 93, "SET-040": 87,
}

RISK_HIGH = {"SET-003", "SET-006", "SET-017", "SET-019", "SET-028", "SET-031", "SET-033", "SET-034", "SET-039"}
FOUNDATION = {"SET-001", "SET-003", "SET-005", "SET-006", "SET-017", "SET-019", "SET-021", "SET-028", "SET-031", "SET-033", "SET-034", "SET-035", "SET-037", "SET-038", "SET-039", "SET-040"}
ARCHIVE_MATCHED = {
    "TASK-007", "TASK-008", "TASK-009", "TASK-010", "TASK-011", "TASK-012", "TASK-013", "TASK-018",
    "TASK-031", "TASK-033", "TASK-035", "TASK-038", "TASK-043", "TASK-075", "TASK-089", "TASK-102",
    "TASK-110", "TASK-145", "TASK-169", "TASK-185", "TASK-216", "TASK-218", "TASK-243", "TASK-257",
    "TASK-286", "TASK-305", "TASK-311", "TASK-315", "TASK-316", "TASK-317", "TASK-318", "TASK-319",
    "TASK-320", "TASK-321",
}


def priority(score: int) -> str:
    return "P0" if score >= 90 else "P1" if score >= 78 else "P2" if score >= 64 else "P3"


def points(raw: int) -> int:
    return next((n for n in (1, 2, 3, 5, 8, 13, 21) if raw <= n), 21)


def main() -> None:
    data = json.loads(SOURCE.read_text())
    tasks = data["tasks"]
    task_ids = {t["id"] for t in tasks}
    incoming = Counter()
    outgoing = Counter()
    dependency_edges = []
    relation_edges = []
    parent_by_child = {}
    for task in tasks:
        for rel in task.get("relationships", []):
            target = rel.get("target_id")
            if target not in task_ids:
                continue
            edge = {"source": task["id"], "target": target, "type": rel["type"], "basis": rel.get("basis", "unknown")}
            relation_edges.append(edge)
            if rel["type"] == "depends_on":
                dependency_edges.append(edge)
                outgoing[task["id"]] += 1
                incoming[target] += 1
            if rel["type"] == "parent":
                parent_by_child[task["id"]] = target

    start = date(2026, 9, 21)
    enriched = []
    for task in tasks:
        centrality = min(8, incoming[task["id"]] * 2 + outgoing[task["id"]])
        score = SET_BASE.get(task["set_id"], 60) + centrality
        if task.get("type") == "epic":
            score += 2
        if task.get("status") == "cancelled":
            score = 0
        score = min(100, score)
        p = priority(score) if score else "İptal"
        important = score >= 78
        urgent = score >= 90 or incoming[task["id"]] >= 2
        quadrant = "Yap" if important and urgent else "Planla" if important else "Devret" if urgent else "Ele/sonra"
        likelihood = 4 if task["set_id"] in RISK_HIGH else 3 if score >= 78 else 2
        impact = 5 if p == "P0" else 4 if p == "P1" else 3 if p == "P2" else 2
        ac_count = len(task.get("acceptance_criteria", []))
        effort = points(max(1, ac_count + len(task.get("child_ids", [])) // 3 + outgoing[task["id"]]))
        horizon = "Şimdi" if p == "P0" else "Sonraki" if p == "P1" else "Daha sonra" if p == "P2" else "Araştır/ele"
        moscow = "Must" if p == "P0" else "Should" if p == "P1" else "Could" if p == "P2" else "Won't/şimdilik"
        week = 0 if p == "P0" else 8 if p == "P1" else 20 if p == "P2" else 36
        due = start + timedelta(weeks=week + (int(task["id"].split("-")[1]) % 8))
        rationale = []
        if task["set_id"] in FOUNDATION:
            rationale.append("pazaryeri omurgası")
        if incoming[task["id"]]:
            rationale.append(f'{incoming[task["id"]]} görevi doğrudan etkiliyor')
        if task["set_id"] in RISK_HIGH:
            rationale.append("yüksek finansal/güvenlik/uyum riski")
        if not rationale:
            rationale.append("büyüme veya operasyon iyileştirmesi")

        safe = {k: v for k, v in task.items() if k not in {"source_refs", "source_content_sha256", "relationship_declarations", "history"}}
        labels = []
        if task["id"] != "TASK-321":
            labels.append("Önceden işlenen")
        if task["id"] in ARCHIVE_MATCHED:
            labels.append("Arşiv taramasında tespit edilen")
        safe["discovery_labels"] = labels
        safe["parent_id"] = parent_by_child.get(task["id"])
        safe["planning"] = {
            "priority": p,
            "priority_score": score,
            "moscow": moscow,
            "horizon": horizon,
            "eisenhower": quadrant,
            "risk_probability": likelihood,
            "risk_impact": impact,
            "risk_score": likelihood * impact,
            "effort_points": effort,
            "dependency_count": outgoing[task["id"]],
            "dependent_count": incoming[task["id"]],
            "centrality": centrality,
            "target_date": due.isoformat(),
            "rationale": rationale,
        }
        enriched.append(safe)

    counts = Counter(t["planning"]["priority"] for t in enriched)
    action_plan = []
    for label, priorities in (("1. Güvenli temel", {"P0"}), ("2. Operasyonel çekirdek", {"P1"}), ("3. Büyüme ve verim", {"P2"}), ("4. Deneyler ve ertelenenler", {"P3"})):
        selected = [t for t in enriched if t["planning"]["priority"] in priorities]
        top_sets = Counter(t["set_id"] for t in selected).most_common(8)
        action_plan.append({"stage": label, "task_count": len(selected), "set_ids": [x[0] for x in top_sets]})

    output = {
        "meta": {
            "dataset_id": data["dataset_id"],
            "dataset_revision": data["dataset_revision"],
            "generated_on": date.today().isoformat(),
            "task_count": len(enriched),
            "set_count": len(data["task_sets"]),
            "relation_count": sum(len(t.get("relationships", [])) for t in tasks),
            "task_to_task_relation_count": len(relation_edges),
            "privacy": "Yerel dosya yolları, dosya hashleri ve kaynak dosya ayrıntıları yayımlanan veri kümesinden çıkarıldı.",
        },
        "methodology": {
            "default_sort": "B2B öncelik puanı azalan, ardından bağımlılık merkeziyeti ve görev ID",
            "priority_model": "Kümenin B2B pazaryeri için işlevsel zorunluluğu + bağımlılık merkeziyeti + epic etkisi; 0-100 arası.",
            "bands": {"P0": "90-100 temel/engelleyici", "P1": "78-89 operasyonel çekirdek", "P2": "64-77 büyüme/verim", "P3": "0-63 deney/sonra"},
            "caveat": "Puanlar ürün planlama başlangıç değeridir. Tarayıcıdaki çalışma alanında değiştirilebilir; maliyet, ekip kapasitesi ve mevzuat doğrulamasıyla kalibre edilmelidir.",
        },
        "priority_counts": dict(counts),
        "archive_audit": {
            "image_count": 180,
            "contact_sheet_count": 23,
            "classification_labels": ["Önceden işlenen", "Arşiv taramasında tespit edilen"],
            "matched_task_count": len(ARCHIVE_MATCHED - {"TASK-321"}),
            "new_task_ids": ["TASK-321"],
            "revised_task_ids": ["TASK-218"],
            "context_only_findings": [
                "Kapasite/efor ve ekip çalışma tahtaları ürün özelliği değil, teslimat-planlama bağlamı olarak ayrıldı.",
                "Mimari teknoloji listeleri mevcut görevlerin uygulama bağlamı; doğrulanmış codebase durumu sayılmadı.",
                "Görev yöneticisi listeleri bu raporlama aracının Jira/ClickUp benzeri çalışma alanı gereksinimlerine uygulandı.",
            ],
        },
        "action_plan": action_plan,
        "task_sets": [{k: v for k, v in s.items() if k not in {"source_refs"}} for s in data["task_sets"]],
        "rules": data["rules"],
        "contexts": data["contexts"],
        "cancelled_notes": [{k: v for k, v in n.items() if k not in {"source_refs"}} for n in data["cancelled_notes"]],
        "open_questions": [{k: v for k, v in q.items() if k not in {"source_refs"}} for q in data["open_questions"]],
        "tasks": enriched,
        "dependency_edges": dependency_edges,
        "relation_edges": relation_edges,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps(output["meta"], ensure_ascii=False))


if __name__ == "__main__":
    main()
