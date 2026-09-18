#!/usr/bin/env python3
"""Publish canonical task scopes without inventing dates, estimates or risk ratings."""
import json
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "istoc-backlog/istoc-backlog.json"
OUTPUT = ROOT / "backlog-site/public/data/backlog.json"
SCORES = {"P0": 95, "P1": 80, "P2": 65, "P3": 40, "Arşiv": 0}
STAGES = ["Temel sözleşmeler", "Ticaret ve operasyon", "Büyüme ve verim", "İleri kapsam", "Karar ve keşif"]

def generate(data):
    tasks = data["tasks"]
    ids = {t["id"] for t in tasks}
    incoming, outgoing = Counter(), Counter()
    relation_edges, dependency_edges, parents = [], [], {}
    for task in tasks:
        for rel in task.get("relationships", []):
            if rel["target_id"] not in ids:
                continue
            edge = {"source": task["id"], "target": rel["target_id"], "type": rel["type"], "basis": rel.get("basis", "unknown"), "reason": rel.get("reason", "")}
            relation_edges.append(edge)
            if rel["type"] == "depends_on":
                dependency_edges.append(edge)
                outgoing[task["id"]] += 1
                incoming[rel["target_id"]] += 1
            if rel["type"] == "parent":
                parents[task["id"]] = rel["target_id"]
    enriched = []
    for task in tasks:
        profile = task["planning_profile"]
        active = task["status"] not in ("superseded", "cancelled")
        priority = profile["priority"] if active else "Arşiv"
        safe = {k: v for k, v in task.items() if k not in {"source_refs", "source_content_sha256", "relationship_declarations", "history"}}
        safe["parent_id"] = parents.get(task["id"])
        safe["planning"] = {
            "priority": priority, "priority_score": SCORES[priority],
            "priority_basis": "Ürün sırası önerisi; ekip tahmini veya aciliyet ölçümü değildir.",
            "moscow": "Değerlendirilmedi", "horizon": profile["stage"], "stage": profile["stage"],
            "eisenhower": "Değerlendirilmedi", "important": None, "urgent": None,
            "risk_probability": None, "risk_impact": None, "risk_score": None, "risk_reason": "",
            "effort_points": None, "estimate_source": "Tahminlenmedi", "target_date": None,
            "dependency_count": outgoing[task["id"]], "dependent_count": incoming[task["id"]],
            "centrality": incoming[task["id"]], "active": active, "scope": profile["scope"],
            "rationale": [profile["reason"], "Tarih ve sayısal efor ancak çalışma alanında açıkça girilirse kullanılır."]
        }
        enriched.append(safe)
    active = [t for t in enriched if t["planning"]["active"]]
    counts = Counter(t["planning"]["priority"] for t in active)
    action_plan = []
    for stage in STAGES:
        selected = [t for t in active if t["planning"]["stage"] == stage]
        action_plan.append({"stage": stage, "task_count": len(selected), "set_ids": sorted({t["set_id"] for t in selected})})
    return {
        "meta": {"dataset_id": data["dataset_id"], "dataset_revision": data["dataset_revision"],
            "generated_on": date.today().isoformat(), "task_count": len(enriched), "active_task_count": len(active),
            "leaf_task_count": sum(not t["child_ids"] for t in active), "set_count": len(data["task_sets"]),
            "relation_count": sum(len(t["relationships"]) for t in tasks), "task_to_task_relation_count": len(relation_edges),
            "privacy": "Yerel dosya yolları, kaynak dosyalar ve özel sürüm geçmişi yayın verisinde bulunmaz."},
        "methodology": {"default_sort": "B2B önceliği; görünen önkoşullar sonuç sırasından önce gelir. Kümeleme işleri başlıklar altında toplar; tüm yürütme sırası için kümelemeyi kapatın. Diğer sıralamalarda açık kullanıcı değerleri esas alınır.",
            "priority_model": "Faz ve kapsam kararıyla verilen ürün sırası. Risk, aciliyet, MoSCoW, tarih ve ekip eforu bağımsız alanlardır; bilinmeyenler sıfır sayılmaz.",
            "bands": {"P0":"Temel ticaretin güvenli tamamlanması", "P1":"Operasyon ve kabul", "P2":"Büyüme, ileri kapsam veya keşif", "P3":"Ertelenen / bağımsız ürün"},
            "caveat": "Bu panel görev tanımlarını yönetir. Backlog durumu mevcut yazılımın eksik olduğunu göstermez. Çalışma alanı değişiklikleri bu tarayıcıda saklanır; ekip tahmini veya ortak sunucu senkronizasyonu varsayılmaz."},
        "priority_counts": dict(counts), "action_plan": action_plan,
        "completion": {"revision":25, "new_task_ids":[t["id"] for t in tasks if int(t["id"].split("-")[1])>321],
            "changes":["Ortak medya, stok/rezervasyon ve uçtan uca kabul sahipleri eklendi.", "Lojistik, RMA, ECA, CMS, arama, fraud ve escrow alt teslimatlara ayrıldı.", "Geçmiş kayıt aktif toplamdan çıkarıldı; post-MVP ve karar bekleyen kapsam ayrıldı.", "Otomatik tarih/SP ve öncelikten türetilmiş risk/aciliyet kaldırıldı."],
            "verification_note":"Uygulama durumu kod incelemesiyle doğrulanacak. Görsel notlarının tek tek kanıt eşlemesi TASK-381 kabul kapsamıdır."},
        "archive_audit": {"image_count":180,"contact_sheet_count":23,
            "classification_labels":["Önceden işlenen","Arşiv taramasında tespit edilen","Tamamlama denetiminde eklenen"],
            "matched_task_count":sum("Arşiv taramasında tespit edilen" in t["discovery_labels"] and t["id"]!="TASK-321" for t in tasks),
            "new_task_ids":["TASK-321"],"revised_task_ids":["TASK-218"],
            "context_only_findings":["Arşiv taraması ile son tamamlama denetimi ayrı keşif etiketleridir.","Görsel envanteri, her notun eksiksiz görev eşlemesi olduğu anlamına gelmez. TASK-381 not bazında kanıt incelemesini içerir."]},
        "task_sets":[{k:v for k,v in s.items() if k!="source_refs"} for s in data["task_sets"]],
        "rules":data["rules"],"contexts":data["contexts"],
        "cancelled_notes":[{k:v for k,v in n.items() if k!="source_refs"} for n in data["cancelled_notes"]],
        "open_questions":[{k:v for k,v in q.items() if k!="source_refs"} for q in data["open_questions"]],
        "external_references":data["external_references"],"tasks":enriched,
        "dependency_edges":dependency_edges,"relation_edges":relation_edges,
    }

def main():
    output = generate(json.loads(SOURCE.read_text()))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output,ensure_ascii=False,separators=(",", ":"))+"\n")
    print(json.dumps(output["meta"],ensure_ascii=False))

if __name__ == "__main__": main()
