import { Editor, EditorPosition, MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import { SyntaxNode, SyntaxNodeRef, Tree } from '@lezer/common';
import { trace_r } from './dev-utils';

declare type CMEditor = Editor & { cm: EditorView };

// Keep track of the active editor instance -- TODO: ONLY TEMPORARY, DELETE LATER
let editor: Editor | null = null;

const ignoredNodeTypes: readonly string[] = [
    // "HyperMD",
    "formatting_formatting-header",
    "formatting_formatting-list",
    "hmd-list-indent",
    // "hmd-task-list-marker",
    // "hmd-table-separator",
    // "hmd-table-cell-contents",
] as const;

/**
 * A simplified node representing a logical, selectable block in the document.
 */
export interface Node {
    type: string; // Original node type from the syntax tree
    from: number; // Start offset of this node's content (excluding children)
    to: number;   // End offset of this node's content (excluding children)
    documentFrom: number; // Start offset within document (including children)
    documentTo: number; // End offset within document (including children)
    children: Node[]; // For hierarchical blocks (e.g., list items inside a list)

    content?: string; // TODO: For debugging purposes -- REMOVE LATER
}

/**
 * The Smart Selection Graph representing the document structure.
 */
export class Graph {
    editor: Editor;
    document: Node;
    constructor(editor: Editor, document: Node) {
        this.editor = editor;
        this.document = document;
    }
    /**
     * Finds the deepest Node that contains the given editor position offset.
     * * @param pos The position (offset) in the document.
     * @returns The Node at that position, or null if outside bounds.
     */
    public getNodeAtPosition(pos: EditorPosition): Node {
        // Start the recursive search from the root document node.
        const offset = this.editor.posToOffset(pos);
        const node = this.searchNode(this.document, offset);
        return node || this.document;
    }

    private searchNode(node: Node, offset: number): Node | null {
        trace_r(node, offset);
        // 1. Check if the offset falls within the current node's total bounds.
        // We assume startOffset is inclusive and endOffset is exclusive for simplicity.
        // We use '>=' for endOffset to correctly select the last character in the node.
        if (offset < node.from || offset >= node.to) {
            return null;
        }
        // 2. Check children for a deeper match (Depth-First Search).
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                // Recursively call the search function on the child node
                const foundNode = this.searchNode(child, offset);
                // If a child or one of its descendants was found, return it immediately.
                if (foundNode) {
                    return foundNode;
                }
            }
        }
        // 3. If no deeper match was found in the children, the current node
        // is the deepest node that contains the position.
        return trace_r(node);
    }
}

/**
 * Traverses the CodeMirror AST to build the simplified Smart Selection Graph.
 */
export function buildSmartSelectionGraph(editor: Editor): Graph | null {
    trace_r();

    // Temporarily set the global editor reference -- TODO: DELETE LATER
    this.editor = editor;

    // Access the CM6 editor instance
    const editorView = ('cm' in editor) && (editor as CMEditor).cm as EditorView;
    if (!editorView) return null;

    // Get the syntax tree for the entire document
    const tree = ensureSyntaxTree(editorView.state, editorView.state.doc.length);
    if (!tree) return null;

    // Traverse the syntax tree to collect all structured nodes
    const sparseList = traverseTreeAndCollectNodes(tree);
    // Fill in the gaps between structured nodes with text nodes
    const flatList = fillGapsWithTextNodes(sparseList);
    // Process the nodes to build a hierarchical graph
    const hierarchy = partitionDynamic(flatList);
    if (hierarchy.length === 0) return null;

    const documentNode = hierarchy[0]; // The root node representing the entire document

    calculateDocumentOffsets(documentNode);

    return new Graph(editor, documentNode);
}

function traverseTreeAndCollectNodes(tree: Tree): Node[] {
    trace_r();
    const nodes: Node[] = [];
    tree.iterate({
        enter: (nodeRef: SyntaxNodeRef) => {
            console.debug('>> NodeRef:', nodeRef.name, nodeRef.from, nodeRef.to, nodeRef.node.parent?.name);
            // nodeRef.node.parent;
            if (!ignoredNodeTypes.map(typePrefix => nodeRef.name.startsWith(typePrefix)).some(Boolean)) {
                const node = mapToNode(nodeRef);
                nodes.push(node);
            }
            return true; // Continue to descend into children for more granular blocks (e.g. Bold text inside Paragraph)
        }
    });
    return trace_r(nodes);
}

function mapToNode(node: SyntaxNodeRef): Node {
    return {
        type: node.name,
        from: node.from,
        to: node.to,
        documentFrom: 0,
        documentTo: 0,
        children: [],

        content: this.editor.getRange(this.editor.offsetToPos(node.from), this.editor.offsetToPos(node.to)).substring(0, 50), // For debugging purposes -- TODO: REMOVE LATER
    };
}

/**
 * This Multi-Pass Partitioning approach uses the name of the first element in a list segment as the target "divider" for that segment. 
 * Elements between two dividers become the children's flat list to be processed recursively later.
 *
 * @param flatList all document nodes in a flat list
 * @returns hierarchical graph of the document
 */
function partitionDynamic(flatList: Node[]): Node[] {
    if (flatList.length === 0) {
        return [];
    }

    const hierarchy: Node[] = [];

    let currentGroup: Node | null = null;
    let subList: Node[] = [];

    // 1. Determine the target element name for this level
    const targetName = flatList[0].type;

    for (const item of flatList) {

        if (item.type === targetName) {
            // --- Target Divider Found ---

            // 2. Finalize the previous group (if one existed)
            if (currentGroup) {
                // Recursively process the gathered subList for the next level down
                currentGroup.children = partitionDynamic(subList);
            }

            // 3. Start a New Group with the new target item
            currentGroup = item;
            hierarchy.push(currentGroup);
            subList = [];

        } else {
            // --- Non-Target Element Found ---

            // 4. Collect non-matching elements (children of the target) to be processed recursively later
            subList.push(item);
        }
    }

    // 5. Finalize the last group
    if (currentGroup) {
        // Recursively process the remaining sub-list for the last group
        currentGroup.children = partitionDynamic(subList);
    }

    // 6. Handle the case where the entire input list was a sub-level
    // If no targetName elements were found (e.g., input was just H2, H3), 
    // the result list is empty, and we must proceed to the next depth.
    if (hierarchy.length === 0 && subList.length > 0) {
        // The whole list needs to be processed at the next level of depth 
        // (relative to its own structure).
        return partitionDynamic(subList);
    }

    return hierarchy;
}
/**
 * Fills the gaps between structured nodes with new TextNodes.
 * This function assumes the structured nodes are provided as a flat list, 
 * sorted by their starting position (from).
 * @param flatList A flat, sorted array of nodes retrieved from the sparse tree.
 * @returns A new, complete flat array of nodes (structured + text nodes).
 */
function fillGapsWithTextNodes(flatList: Node[]): Node[] {
    
    const completeNodeList: Node[] = [];
    let currentPosition = 0;
    const documentLength = this.editor.getValue().length;

    // 1. Iterate through the structured nodes
    for (const node of flatList) {
        // --- A. Check for a Gap Before the Current Node ---
        if (node.from > currentPosition) {
            // Gap found: The text from currentPosition to node.from is missing.
            const gapText = this.editor.getRange(currentPosition, node.from);
            
            if (gapText.length > 0) {
                // Create and insert the TextNode for the gap
                const textNode: Node = {
                    type: 'Text',
                    from: currentPosition,
                    to: node.from,
                    documentFrom: currentPosition,
                    documentTo: node.from,
                    children: [],
                    content: gapText,
                };
                completeNodeList.push(textNode);
            }
        }
        
        // --- B. Add the Structured Node ---
        completeNodeList.push(node);
        
        // --- C. Update Position ---
        // The new current position is the end of the structured node's span.
        currentPosition = node.to;
    }

    // 2. Check for a Trailing Gap 
    // If the last structured node didn't cover the end of the document
    if (currentPosition < documentLength) {
        const trailingText = this.editor.getRange(currentPosition, documentLength);

        if (trailingText.length > 0) {
            const textNode: Node = {
                type: 'Text',
                from: currentPosition,
                to: documentLength,
                documentFrom: currentPosition,
                documentTo: documentLength,
                children: [],
                content: trailingText,
            };
            completeNodeList.push(textNode);
        }
    }

    return completeNodeList;
}

function calculateDocumentOffsets(node: Node): void {
    const children = node.children;
    if (children && children.length > 0) {
        children[0].documentFrom = node.from;
        
        for (let i = 0; i < children.length; i++) {
            const currentChild = children[i];
            const nextChild = children[i + 1];
            
            // 1. Recurse into children first (Depth-First)
            calculateDocumentOffsets(currentChild);

            // 2. Set the current child's 'to' based on the next sibling's 'from'
            if (nextChild) {
                // Sibling check: The current node ends where the next sibling begins.
                currentChild.to = nextChild.from;
            } else {
                // Last child check: The current node ends where the parent ends (parent.from + parent.length).
                currentChild.to = node.to;
            }
        }
    }
}