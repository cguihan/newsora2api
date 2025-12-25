custom_mods/overrides contains the modified files that were previously merged into the core.

To reapply after updating upstream:
1) From repo root, run:
   powershell -ExecutionPolicy Bypass -File custom_mods\apply_mods.ps1

This overwrites files in the repo with the versions under custom_mods/overrides.
