#!/usr/bin/env python3
"""Verify the shared, pinned 3dviz-pro-max skill and its two routing entries.

Standard library only; offline and read-only. This checks installed file
integrity, not client discovery, third-party execution, or rendered scenes.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys


SKILL_PATH = ".ai-tools/3dviz-pro-max/skill"
ENTRYPOINTS = (
    ".agents/skills/3dviz-pro-max/SKILL.md",
    ".claude/skills/3dviz-pro-max/SKILL.md",
)
REPOSITORY = "https://github.com/viettranx/3dviz-pro-max"
CANONICAL_PATH = "skills/3dviz-pro-max"


def relative_path(value):
    """Reject traversal, alternate separators and noncanonical manifest paths."""
    if (not isinstance(value, str) or not value or "\\" in value or ":" in value
            or any(ord(char) < 32 for char in value)):
        raise ValueError("Invalid relative path in manifest")
    path = PurePosixPath(value)
    if (not path.parts or path.is_absolute() or ".." in path.parts
            or path.as_posix() != value):
        raise ValueError("Noncanonical or escaping path in manifest")
    return path


def validate_record(row, names, upstream=False):
    if not isinstance(row, dict):
        raise ValueError("Invalid manifest file record")
    name = row.get("path")
    relative_path(name)
    if name in names:
        raise ValueError("Duplicate manifest path: " + name)
    names.add(name)
    size = row.get("bytes")
    if (isinstance(size, bool) or not isinstance(size, int) or size < 0
            or not re.fullmatch(r"[0-9a-f]{64}", str(row.get("sha256", "")))):
        raise ValueError("Invalid size or digest: " + name)
    if upstream:
        expected_source = "LICENSE" if name == "LICENSE" else CANONICAL_PATH + "/" + name
        if (row.get("source_path") != expected_source
                or row.get("mode") not in {"100644", "100755"}
                or not re.fullmatch(r"[0-9a-f]{40}", str(row.get("git_blob_sha", "")))):
            raise ValueError("Invalid upstream provenance: " + name)
    return size


def load_manifest(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if (not isinstance(data, dict) or data.get("schema_version") != 2
            or data.get("skill") != "3dviz-pro-max"
            or data.get("repository") != REPOSITORY
            or data.get("upstream_directory") != CANONICAL_PATH
            or data.get("upstream_license_path") != "LICENSE"
            or data.get("license") != "MIT"
            or data.get("install_paths") != [SKILL_PATH]
            or not re.fullmatch(r"[0-9a-f]{40}", str(data.get("commit", "")))
            or not re.fullmatch(r"[0-9a-f]{40}", str(data.get("upstream_tree", "")))):
        raise ValueError("Unsupported or invalid source manifest")
    records = data.get("files")
    if not isinstance(records, list) or not records:
        raise ValueError("Manifest has no file records")
    names = set()
    total = sum(validate_record(row, names, upstream=True) for row in records)
    if (not {"SKILL.md", "LICENSE"}.issubset(names)
            or data.get("file_count") != len(records)
            or data.get("total_bytes") != total):
        raise ValueError("Incomplete or inconsistent upstream manifest")
    entries = data.get("entrypoints")
    if not isinstance(entries, list) or len(entries) != len(ENTRYPOINTS):
        raise ValueError("Missing project routing entries")
    names = set()
    for row in entries:
        validate_record(row, names)
    if names != set(ENTRYPOINTS):
        raise ValueError("Unexpected project routing entry")
    return data


def checked_file(root, relative):
    """Do not follow symlinks anywhere below the selected project root."""
    current = root
    for part in relative.parts:
        current = current / part
        mode = current.lstat().st_mode
        if stat.S_ISLNK(mode):
            raise ValueError("symlink")
    if not stat.S_ISREG(mode):
        raise ValueError("not a regular file")
    return current


def file_hashes(path, size):
    sha256 = hashlib.sha256()
    git_blob = hashlib.sha1(b"blob " + str(size).encode("ascii") + b"\0")
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha256.update(chunk)
            git_blob.update(chunk)
    return sha256.hexdigest(), git_blob.hexdigest()


def verify_records(root, records, prefix="", upstream=False):
    errors = []
    verified = 0
    for record in records:
        name = prefix + "/" + record["path"] if prefix else record["path"]
        try:
            path = checked_file(root, relative_path(name))
            size = path.stat().st_size
            if size != record["bytes"]:
                raise ValueError("size mismatch")
            sha256, git_blob = file_hashes(path, size)
            if sha256 != record["sha256"]:
                raise ValueError("SHA-256 mismatch")
            if upstream and git_blob != record["git_blob_sha"]:
                raise ValueError("Git blob SHA mismatch")
            verified += 1
        except (OSError, ValueError) as error:
            errors.append({"path": name, "reason": str(error)})
    return {"expected_files": len(records), "verified_files": verified,
            "ok": not errors}, errors


def verify(root, manifest):
    skill, errors = verify_records(root, manifest["files"], SKILL_PATH, upstream=True)
    entries, entry_errors = verify_records(root, manifest["entrypoints"])
    errors.extend(entry_errors)
    return {"ok": not errors, "skill": "3dviz-pro-max",
            "commit": manifest["commit"], "read_only": True,
            "runtime_verified": False,
            "installation": {"path": SKILL_PATH, **skill},
            "entrypoints": entries, "errors": errors,
            "note": "Checks manifest-listed files only; client discovery and rendering are not tested."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2],
                        help="Project root (defaults to this script's repository)")
    args = parser.parse_args()
    try:
        manifest = load_manifest(Path(__file__).with_name("source.json"))
        root = args.root.resolve(strict=True)
        if not root.is_dir():
            raise ValueError("Project root is not a directory")
        result = verify(root, manifest)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0 if result["ok"] else 1
    except (OSError, ValueError, TypeError, KeyError) as error:
        print(json.dumps({"ok": False, "read_only": True,
                          "runtime_verified": False, "error": str(error)},
                         ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
