---
name: 3dviz-pro-max
description: Design, improve and inspect expressive 3D scenes, geometry, perspective, cameras, materials, lighting and interactive spatial models using this project's pinned 3Dviz Pro Max resources.
---

# 3Dviz Pro Max — project entry point

This small entry point routes to the complete shared skill. Read
[the upstream SKILL.md](../../../.ai-tools/3dviz-pro-max/skill/SKILL.md)
before applying its workflow. The canonical local directory is
`.ai-tools/3dviz-pro-max/skill/` from the project root. Resolve the upstream
skill's relative references, data, scripts and templates from that directory,
not from this entry point.

Use the project's existing engine, visual direction, controls and development
instructions. Combine the relevant 3D guidance with the other project skills;
small edits only need the affected parts of the workflow.

From the project root, the offline catalog can be searched with:

```bash
python3 -B .ai-tools/3dviz-pro-max/skill/scripts/search.py "fantasy village" --collection recipes --limit 3
```

Run game builds in the game's directory. The skill's optional capture and
Blender helpers are separate tools; availability does not establish a visual
inspection or a successful bake. For `hero-tier.py` in this layout, supply
`--root` with the project directory and `--t1-glb` with an existing source GLB.

See [integration and provenance](../../../.ai-tools/3dviz-pro-max/README.md)
for the pinned revision, integrity check, optional tools and update procedure.
