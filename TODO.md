
NOTES

Terminology: Expand / Shrink Selection → common terminology used in IntelliJ, VS Code.
Naming (technical): Prepend plugin name with 'obsidian-'. See manifest.json
The plugin is stateless. With every command, the current selection determines the next action.


TODO

- write tests for EditorStub

- rename plugin to "Smart Select" (and remove the BETA part)
- rename plugin class names internally to reflect new plugin name
- update manifest.json: (look at obsidian-plugin-sample)
    {
        "id": "obsidian-smart-select",
        "name": "Smart Select"
    }