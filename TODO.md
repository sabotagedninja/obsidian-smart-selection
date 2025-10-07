
NOTES

Terminology: Expand / Shrink Selection → common terminology used in IntelliJ, VS Code.
Naming (technical): Prepend plugin name with 'obsidian-'. See manifest.json
The plugin is stateless. With every command, the current selection determines the next action.


TODO

- write tests for EditorStub

- update manifest.json: (look at obsidian-plugin-sample)
    {
        "id": "obsidian-smart-select",
        "name": "Smart Select"
    }
    
// TODO register every important function call so that I can see the path travelled through the code - RedLine.register()
// TODO remove log(TRACE)
// TODO add some explaining comments to test-helpers.expandOrShrinkSelection()

