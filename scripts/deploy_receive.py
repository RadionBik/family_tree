#!/usr/bin/env python3
"""Forced command of the CI deploy key on the VPS (`command=` in ~/.ssh/authorized_keys).

stdin: `docker save family_tree-backend family_tree-frontend | gzip`.
Loads the archive only if it names no image outside ALLOWED, then runs `make prod`.
CI cannot write files on the server, so this script, the Makefile and the compose files
change only with a manual `send_to_prod.sh`.
"""

import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile

ALLOWED = {"family_tree-backend:latest", "family_tree-frontend:latest"}
TREE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def image_names(path: str) -> set[str]:
    """Names `docker load` can tag: manifest.json RepoTags (classic store), index.json (containerd store)."""
    names = set()
    with tarfile.open(path, "r:gz") as tar:
        files = set(tar.getnames())
        if "manifest.json" in files:
            for entry in json.load(tar.extractfile("manifest.json")):
                names.update(entry.get("RepoTags") or [])
        if "index.json" in files:
            for m in json.load(tar.extractfile("index.json")).get("manifests", []):
                name = m.get("annotations", {}).get("io.containerd.image.name")
                if name:
                    names.add(name.removeprefix("docker.io/library/"))
    return names


def main() -> int:
    with tempfile.NamedTemporaryFile(suffix=".tar.gz") as f:
        shutil.copyfileobj(sys.stdin.buffer, f)
        f.flush()
        try:
            names = image_names(f.name)
        except (tarfile.TarError, OSError, ValueError) as e:
            print(f"rejected: not a gzip docker save archive: {e}", file=sys.stderr)
            return 1
        if not names or not names <= ALLOWED:
            print(
                f"rejected: images {sorted(names)}, allowed {sorted(ALLOWED)}",
                file=sys.stderr,
            )
            return 1
        subprocess.run(["docker", "load", "-i", f.name], check=True)
    subprocess.run(["make", "-C", TREE, "prod"], check=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
