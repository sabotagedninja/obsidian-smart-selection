
NOTES

Expand / Shrink Selection → common terminology used in IntelliJ, VS Code.
Prepend plugin name with 'obsidian-'. See manifest.json


TODO

- cleanup the algorithm and state vars in plugin
    - maybe use Code Mirror positions instead of indexes primarily? Only switch to indexes when its easier to work with in calculations.
- fix shrinkSelection
- write some more tests for expandSelection
- write tests for shrinkSelection
- create test for SimpleMockEditor

- rename plugin to "Smart Select" (and remove the BETA part)
- rename plugin class names internally to reflect new plugin name
- update manifest.json: (look at obsidian-plugin-sample)
    {
        "id": "obsidian-smart-select",
        "name": "Smart Select"
    }