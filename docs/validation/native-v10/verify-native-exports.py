#!/usr/bin/env python3
"""Read-only comparison of campaign exports supplied after UI actions.

python verify-native-exports.py --mode migration --report native-migration-check.json
python verify-native-exports.py --mode all --report native-export-verification.json

Modes: baseline, migration, completion, reload, all. Exit 0 = passed,
1 = failed, 2 = missing inputs. Only --report writes a file. Input exports
are never generated, repaired or changed. Reconstructed after environment
transfer removed the previous /workspace/shared location.
"""
import argparse
import copy
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

BASELINE_SHA256 = "7d65257fc71f6c610d7467df92d18a3d805066134a942b576f7176691eadd64f"
FILES = {
    "baseline": "native-v8-before-upgrade.json",
    "migration": "native-v9-after-upgrade.json",
    "completion": "native-v9-completed.json",
    "reload": "native-v9-after-reload.json",
}
OLD = [f"MI{i:02d}" for i in range(1, 9)]
FLAGS = "localsHeard approachPrepared routeInspected hamletsRecorded migrationObserved lightsOff gateOperated migrationResolved passagePreserved cropsFertilized harvestFragile snipersTriggered logisticsReleased logisticsArrived logisticsDestroyed reportTransmitted manifestRead".split()
COUNTS = "migratorsTotal migratorsArrived migratorsDisplaced migratorsLost columnsIntact homesHabitable pollinatorsPresent snipersNeutralized".split()
EMPTY_ROUTE = {"route": "unselected", "approach": "unprepared", **dict.fromkeys(FLAGS, False), **dict.fromkeys(COUNTS, 0), "logisticsIntegrity": 0, "roster": None}


def pairs_without_duplicates(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise ValueError("Duplicate JSON key: " + key)
        out[key] = value
    return out


def reject_constant(value):
    raise ValueError("Non-finite JSON constant: " + value)


def get(data, *keys):
    for key in keys:
        if not isinstance(data, dict) or key not in data:
            return None
        data = data[key]
    return data


def mission_ids(data):
    completed = get(data, "completed")
    return sorted(completed) if isinstance(completed, dict) else None


def diff(expected, actual, path="$", limit=30):
    out = []

    def visit(a, b, at):
        if len(out) >= limit:
            return
        if isinstance(a, dict) and isinstance(b, dict):
            for key in sorted(set(a) | set(b)):
                if len(out) >= limit:
                    return
                if key not in a or key not in b:
                    out.append({"path": at + "." + key, "difference": "added" if key not in a else "removed"})
                else:
                    visit(a[key], b[key], at + "." + key)
        elif isinstance(a, list) and isinstance(b, list):
            if len(a) != len(b):
                out.append({"path": at, "difference": "length", "expected": len(a), "actual": len(b)})
            for index, (left, right) in enumerate(zip(a, b)):
                visit(left, right, f"{at}[{index}]")
        elif isinstance(a, bool) != isinstance(b, bool) or a != b:
            out.append({"path": at, "difference": "value", "expected": a, "actual": b})

    visit(expected, actual, path)
    return out


def project_list(items, fields):
    if not isinstance(items, list) or any(not isinstance(item, dict) for item in items):
        return None
    return [{field: item.get(field) for field in fields} for item in items]


def audit(directory, mode):
    phases = {"baseline": ["baseline"], "migration": ["baseline", "migration"],
              "completion": ["baseline", "completion"], "reload": ["baseline", "completion", "reload"],
              "all": list(FILES)}[mode]
    report = {"schema": 1, "version": "0.10.0", "checkedAtUtc": datetime.now(timezone.utc).isoformat(),
              "method": "Independent Python standard-library comparison; no game module, simulation or browser execution.",
              "scope": "Exact v8 to v9 migration, orchard completion receipt, conserved prior facts and no reward duplication after reload/export.",
              "originLimit": "Exports are supplied by the operator following UI actions. JSON inspection alone does not establish browser gestures or a complete human playthrough.",
              "mode": mode, "pathsRelativeTo": "directory containing this report and verifier", "verifierSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "inputs": {}, "checks": [], "browserOperatedByVerifier": False, "campaignInputsModified": False}
    loaded = {}

    def check(identifier, passed, **details):
        report["checks"].append({"id": identifier, "status": "passed" if passed else "failed", **details})

    def equal(identifier, expected, actual):
        delta = diff(expected, actual)
        check(identifier, not delta, differences=delta, differencesLimit=30)

    for phase in phases:
        file = directory / FILES[phase]
        item = report["inputs"][phase] = {"file": FILES[phase]}
        if not file.is_file():
            item["status"] = "pending"
            report["checks"].append({"id": phase + ".input", "status": "pending", "reason": "Export absent; no outcome inferred."})
            continue
        try:
            raw = file.read_bytes()
            item.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
            data = json.loads(raw, object_pairs_hook=pairs_without_duplicates, parse_constant=reject_constant)
            if not isinstance(data, dict):
                raise ValueError("Campaign must be a JSON object")
            item["status"] = "read"
            item["observed"] = {key: data.get(key) for key in ["format", "version", "revision", "stage", "activeMissionId", "resources"]}
            item["observed"]["completedMissions"] = mission_ids(data)
            loaded[phase] = data
        except (OSError, UnicodeError, ValueError, TypeError) as exc:
            item.update(status="invalid", error=str(exc))
            check(phase + ".json", False, error=str(exc))

    before = loaded.get("baseline")
    if before is not None:
        check("baseline.authentic_v8_bytes", report["inputs"]["baseline"]["sha256"] == BASELINE_SHA256, expectedSha256=BASELINE_SHA256)
        equal("baseline.format", "ordre-de-cendre.campaign", before.get("format"))
        equal("baseline.version", 8, before.get("version"))
        equal("baseline.eight_reports", OLD, mission_ids(before))
        equal("baseline.resources", {"parts": 38, "fuel": 0}, before.get("resources"))
        check("baseline.no_thyr", isinstance(before.get("world"), dict) and "thyr" not in before["world"])

    migrated = loaded.get("migration")
    if before is not None and migrated is not None:
        expected = copy.deepcopy(before)
        if isinstance(expected.get("world"), dict):
            expected["version"] = 9
            expected["world"]["thyr"] = {"route": copy.deepcopy(EMPTY_ROUTE)}
            equal("migration.only_version_and_empty_thyr_added", expected, migrated)
        else:
            check("migration.baseline_world", False)
        equal("migration.stage_preserved", before.get("stage"), migrated.get("stage"))
        equal("migration.eight_reports_exact", before.get("completed"), migrated.get("completed"))
        equal("migration.resources_38_unchanged", before.get("resources"), migrated.get("resources"))

    final = loaded.get("completion")
    if before is not None and final is not None:
        equal("completion.format", "ordre-de-cendre.campaign", final.get("format"))
        equal("completion.version", 9, final.get("version"))
        equal("completion.nine_reports", OLD + ["MI09"], mission_ids(final))
        for mission in OLD:
            equal("completion.preserved_" + mission, get(before, "completed", mission), get(final, "completed", mission))
        for planet in ["vesper", "nacre"]:
            equal("completion.preserved_world_" + planet, get(before, "world", planet), get(final, "world", planet))
        equal("completion.resources_42", {"parts": 42, "fuel": 0}, final.get("resources"))
        equal("completion.maintenance_history", before.get("maintenanceLog"), final.get("maintenanceLog"))
        equal("completion.stage", "complete", final.get("stage"))
        equal("completion.no_active_mission", None, final.get("activeMissionId"))
        equal("completion.no_live_checkpoint", None, final.get("checkpoint"))
        receipt = get(final, "completed", "MI09")
        check("completion.mi09_receipt_present", isinstance(receipt, dict))
        if isinstance(receipt, dict):
            expected = {"missionId": "MI09", "choice": "defy", "partsGranted": 4, "route": "migration",
                        "migratorsTotal": 4, "migratorsArrived": 4, "migratorsDisplaced": 0, "migratorsLost": 0,
                        "columnsIntact": 2, "homesHabitable": 2, "pollinatorsPresent": 2, "snipersNeutralized": 2,
                        "logisticsIntegrity": 1, "collateral": 0, **dict.fromkeys(FLAGS, True),
                        "harvestFragile": False, "logisticsDestroyed": False}
            for key, wanted in expected.items():
                equal("completion.mi09." + key, wanted, receipt.get(key))
            equal("completion.last_debrief_exact", receipt, final.get("lastDebrief"))
            equal("completion.world_matches_receipt", {key: receipt.get(key) for key in EMPTY_ROUTE}, get(final, "world", "thyr", "route"))
            roster = receipt.get("roster")
            check("completion.physical_roster_present", isinstance(roster, dict))
            if isinstance(roster, dict):
                animals = roster.get("migrators")
                wanted = [{"id": f"thyr-longue-dorse-{i+1}", "x": x, "targetX": x, "phase": "arrived", "destination": "orchard", "moving": False, "destroyed": False} for i, x in enumerate([4660, 4740, 4820, 4900])]
                equal("completion.four_physical_orchard_arrivals", wanted, project_list(animals, wanted[0]))
                check("completion.four_animals_alive", isinstance(animals, list) and len(animals) == 4 and all(isinstance(a, dict) and isinstance(a.get("hp"), (int, float)) and a["hp"] > 0 for a in animals))
                wanted = [{"id": f"thyr-home-{i}", "habitable": True, "supported": True, "destroyed": False} for i in [1, 2]]
                equal("completion.two_habitable_supported_homes", wanted, project_list(roster.get("homes"), wanted[0]))
                for key, wanted in {"id": "thyr-logistics", "x": 5500, "targetX": 5500, "released": True, "arrived": True, "moving": False, "destroyed": False, "hp": 720, "maxHp": 720}.items():
                    equal("completion.transport." + key, wanted, get(roster, "logistics", key))
                equal("completion.physical_report_transmitted", True, get(roster, "report", "transmitted"))
                wanted = [{"id": f"thyr-sniper-{i}", "hp": 0, "dead": True} for i in [1, 2]]
                equal("completion.two_snipers_resolved", wanted, project_list(roster.get("snipers"), wanted[0]))
            fleet = before.get("fleet")
            if isinstance(fleet, dict):
                for walker, state in fleet.items():
                    if walker != receipt.get("walkerId"):
                        equal("completion.unused_fleet_" + walker, state, get(final, "fleet", walker))

    reloaded = loaded.get("reload")
    if final is not None and reloaded is not None:
        equal("reload.entire_dossier_exact", final, reloaded)
        equal("reload.resources_42_no_second_grant", {"parts": 42, "fuel": 0}, reloaded.get("resources"))
        equal("reload.nine_reports_exact", final.get("completed"), reloaded.get("completed"))
        equal("reload.world_exact", final.get("world"), reloaded.get("world"))
        equal("reload.receipt_grant_remains_four", 4, get(reloaded, "completed", "MI09", "partsGranted"))

    for phase in phases:
        needed = ["baseline"] + (["completion"] if phase == "reload" else [])
        if phase in loaded and any(item not in loaded for item in needed):
            report["checks"].append({"id": phase + ".dependencies", "status": "pending", "reason": "Required earlier export missing or invalid; no comparison inferred."})
    report["totals"] = {state: sum(c["status"] == state for c in report["checks"]) for state in ["passed", "failed", "pending"]}
    report["status"] = "failed" if report["totals"]["failed"] else "pending" if report["totals"]["pending"] else "passed"
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dir", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--mode", choices=["baseline", "migration", "completion", "reload", "all"], default="all")
    parser.add_argument("--report", type=Path, help="Only this report is written; relative path resolves inside --dir")
    args = parser.parse_args()
    directory = args.dir.resolve()
    report = audit(directory, args.mode)
    output = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.report:
        destination = args.report if args.report.is_absolute() else directory / args.report
        protected = {(directory / name).resolve() for name in FILES.values()} | {Path(__file__).resolve()}
        if destination.resolve() in protected:
            parser.error("A report may not overwrite an input or the verifier")
        destination.write_text(output, encoding="utf-8")
        print(json.dumps({"status": report["status"], "totals": report["totals"], "report": str(destination)}, ensure_ascii=False))
    else:
        print(output, end="")
    return {"passed": 0, "failed": 1, "pending": 2}[report["status"]]


if __name__ == "__main__":
    raise SystemExit(main())
