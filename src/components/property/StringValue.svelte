<script>
    import { getPrimitiveValue } from "../../lib/yamlUtils";
    import JsEditor from "../editor/JsEditor.svelte";
    import PebbleEditor from "../editor/PebbleEditor.svelte";

    let { yaml, mnemonic, spec, onchange = () => {} } = $props();

    let textareaEl;
    let value = $derived(getPrimitiveValue(yaml, spec) ?? "");
    let isMultiline = $derived(
        typeof value === "string" && value.includes("\n"),
    );
    let editorHint = $derived(
        spec?.hints?.find((h) => h.startsWith("editor:"))?.slice(7) ?? null,
    );
    let isJs = $derived(editorHint === "js");
    let isPebble = $derived(editorHint === "Pebble");

    function handleInput(e) {
        autoResize(e.target);
    }

    function handleBlur(e) {
        const text = /** @type {HTMLTextAreaElement} */ (e.target).value;
        onchange(text === "" ? null : text);
    }

    function handleEditorChange(text) {
        onchange(text === "" ? null : text);
    }

    function autoResize(el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }

    $effect(() => {
        if (textareaEl && isMultiline) {
            autoResize(textareaEl);
        }
    });
</script>

{#if isJs}
    <JsEditor text={value} canEdit={true} onchange={handleEditorChange} />
{:else if isPebble}
    <PebbleEditor text={value} canEdit={true} onchange={handleEditorChange} />
{:else if isMultiline}
    <textarea
        bind:this={textareaEl}
        {value}
        oninput={handleInput}
        onblur={handleBlur}
    ></textarea>
{:else}
    <input type="text" {value} onblur={handleBlur} />
{/if}

<style>
    input,
    textarea {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid var(--border-default);
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        background: var(--surface-2);
        color: var(--text-primary);
    }
    textarea {
        resize: vertical;
        overflow-y: auto;
        max-height: 200px;
        min-height: 28px;
    }
    input:focus,
    textarea:focus {
        outline: none;
        border-color: var(--primary);
    }
</style>
