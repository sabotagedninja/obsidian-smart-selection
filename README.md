# Smart Selection

**Smart Selection** makes selecting text in Obsidian more intuitive and efficient.  
It lets you expand or shrink selections step by step — from cursor to a single line to an entire paragraph — using keyboard shortcuts.

## 📰 Latest news

Awaiting review and inclusion into the official community plugins list — exciting :D

## ✨ Features

- **Expand** or **shrink** selections logically by pressing a key combination
  (e.g `Ctrl + A` / `Ctrl + Shift + A` — you need to set it yourself after installation, see [Setup](#-setup)).
- Works with lines, paragraphs, lists and other elements.
- Mimics modern IDE selection behavior (e.g., VS Code, IntelliJ).
- Compatible with both Live Preview and Source Mode.
- Fully configurable keyboard shortcuts.
- Compatible with Obsidian v1.0.0 and later (due to API compatibility with the `Editor` abstraction in `obsidian.d.ts` for CodeMirror 6).

## 🪄 Roadmap

- Selecting a **single word** — Right now, a line is the smallest increment.
- Selecting **quoted strings** and text between **parentheses**
- **Heading + Segment** support — Selecting Heading + Segment combo as a logical unit.
- **Code block** support — Selecting entire code block as a logical unit (does not work right now when the code block contains multiple consecutive blank lines).
- **Table** support — Selecting contents of a cell, row, and the entire table.
- **Mobile** support via buttons in the ribbon menu — Now only supported via the Command palette.

## ⚙️ Installation

1. In Obsidian, go to **Settings → Community Plugins**.  
2. Turn **Safe Mode** off if needed.  
3. Click **Browse** and search for **Smart Selection**.  
4. Click **Install**, then **Enable** the plugin.

Or clone this repository and run it locally — See [Local development](#local-development) for details. 

## 🔧 Setup

Proposed keyboard shortcuts:

| Action           | Windows/Linux      | macOS             |
| ---------------- | ------------------ | ----------------- |
| Expand selection | `Ctrl + A`         | `Cmd + A`         |
| Shrink selection | `Ctrl + Shift + A` | `Cmd + Shift + A` |

You can change these in **Settings → Hotkeys → Smart Selection**.

## 🧩 Using the plugin

Each time you press the shortcut, Smart Selection analyzes the current cursor position and expands (or shrinks) the selection to the next logical boundary.
### Example 1: Expand selection
```
# The Raven - by Edgar Allan Poe

Once upon a midnight dreary, while I pondered, weak and weary,
Over many a quaint and curious volume of forgotten lore — 
While I nodded, nearly napping, suddenly there came a tapping,
As of some one gently rapping, rapping at my chamber door.
"'Tis some visiter," I muttered, "tapping at my chamber door — 
		Only this and nothing more."

. . .
```

With the cursor placed somewhere on the first line `Once upon a midnight dreary…`:

| Press            | Selection becomes                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Ctrl + A`       | The first line: <br>`Once upon a midnight dreary, while I pondered, weak and weary,`                                  |
| `Ctrl + A` again | The entire paragraph: <br>`Once upon a midnight dreary, while I pondered, weak and weary,`<br>`Over many a quaint...` |
| `Ctrl + A` again | The entire document                                                                                                     |
|                  |                                                                                                                         |
### Example 2: Shrink selection

```
# The Raven - analysis

- THEME: Grief, loss, and the descent into madness.
- NARRATIVE VOICE: First-person, unreliable narrator mourning his lost love, Lenore.
- SYMBOLISM:
    - The raven = unrelenting memory, death, or fate.
    - Lenore = idealized, unattainable beauty or lost purity.
    - Midnight/Darkness = mental despair.
- TONE: Melancholic, eerie, and obsessive.
- STRUCTURE: 18 stanzas of six lines each; trochaic octameter with internal rhyme and refrain (“Nevermore”).
- MOOD PROGRESSION: Calm → curious → desperate → hopeless.
- CENTRAL CONFLICT: Rational mind vs. emotional torment; search for meaning in suffering.
- ENDING: Final acceptance of eternal grief—soul trapped beneath the shadow of the raven.
```

With the cursor placed on the fourth line after `- The raven` and pressing `Ctrl + A` three times to select the entire document:

| Press                    | Selection becomes                                                               |
| ------------------------ | ------------------------------------------------------------------------------- |
| `Ctrl + Shift + A`       | The entire paragraph with all the bullet points                                 |
| `Ctrl + Shift + A` again | The fourth line:<br>`    - The raven = unrelenting memory, death, or fate.` |
| `Ctrl + Shift + A` again | Restores the original cursor position after `- The raven`                   |

## 🧠 Core concepts

- **Logical boundaries**  
    The plugin expands or shrinks the current selection based on text structure rather than fixed character counts. Boundaries can be words, quoted strings, parentheses, list items, lines, code blocks, or paragraph segments, depending on context.
    
- **Origin cursor**  
    The position of the caret before the first expansion is remembered as the **origin**. All subsequent expand/shrink operations are computed relative to this origin. It acts as the center of the selection behavior.
    
- **Origin retention rule**  
    The origin is kept only if it remains inside the current selection. A hidden side-effect to this is that if the user makes a selection while keeping the origin within the selection, the origin is still valid and expand/shrink operations will work, keeping the origin. If the user moves the selection so that the origin falls outside it, the origin resets to the current **selection anchor** (the fixed end of the selection). This ensures consistent direction and prevents erratic jumps.
    
- **Stateless operation**  
    The plugin keeps no persistent state between commands (except for the origin cursor). Each invocation recalculates the selection purely from the editor’s current selection and cursor positions. There is no undo stack or memory of previous boundaries beyond what is visible in the editor.
    
- **Pure selection logic**  
    It never changes the document text. Only the highlighted range changes. Typing, deleting, or moving the cursor interrupts the Smart Selection flow naturally, since new selections become the new basis for calculation.
    
- **Symmetric expansion and shrinking**  
    Expand (`Ctrl+A`) moves outward to the next logical unit. Shrink (`Ctrl+Shift+A`) reverses that step, returning to the previous boundary — as long as it can be computed from the current selection and origin relationship. 

## 🧪 Troubleshooting

If the plugin doesn’t seem to respond:
- Verify the plugin is enabled in **Settings → Community Plugins**.
- Check for hotkey conflicts under **Settings → Hotkeys**.
- Ensure you are in the editor (not the preview pane).
- Have you tried turning it off and on again?
- Try restarting Obsidian.
- If all else fails, throw the computer out the window (I'm not liable for any damages caused).

## ⚠️ Known issues

- May behave unexpectedly in tables or complex embedded elements.  
- Expansion logic may vary slightly between Live Preview and Source Mode.  

## 🤝 Contributing

Contributions via bug reports, bug fixes, documentation, and general improvements are always welcome. For more major feature work, make an issue about the feature idea / reach out to me so we can judge feasibility and how best to implement it.

### Local development

The codebase is written in TypeScript and uses `node` / `esbuild` for compilation; for a first time set up, all you should need to do is pull, install, and build:

```shell
$ git clone git@github.com:sabotagedninja/obsidian-smart-selection.git
$ cd obsidian-smart-selection
$ npm install
$ npm run dev
```

This will install libraries and build the plugin. This will also put `esbuild` in watch mode, so any changes to the code will be re-compiled.

**Tip:** Clone the repository inside the `.obsidian/plugins/` folder. Use the `Plugin Reloader` plugin in Obsidian to manually reload the plugin after any change you want to test (faster than restarting Obsidian).

## 💰 Support

If you are enjoying this plugin then please support my work and enthusiasm by buying me a coffee. Ninjas need coffee too :)

<a href="https://www.buymeacoffee.com/sabotagedninja" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 45px !important;width: 162px !important;" ></a>
<a href='https://ko-fi.com/B0B01MKITN' target='_blank'><img height='45' style='border:0px;height:45px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## 📄 License

MIT License © 2025 sabotagedninja 

Smart Selection is an open-source community plugin for Obsidian.
