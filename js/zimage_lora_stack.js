import { app } from "../../scripts/app.js";

const MAX_SLOTS = 10;
const PREFIXES = ["lora", "strength", "enabled", "fuse_qkv"];

function makeDivider(slotNum) {
    return {
        name: `divider_${slotNum}`,
        type: "divider",
        draw(ctx, node, width, y, height) {
            ctx.save();
            ctx.strokeStyle = "rgba(255,255,255,0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(10, y + height * 0.5);
            ctx.lineTo(width - 10, y + height * 0.5);
            ctx.stroke();
            ctx.restore();
        },
        computeSize() { return [0, 12]; },
        serialize: false,
    };
}

app.registerExtension({
    name: "ZImage.LoraStack",

    nodeCreated(node) {
        if (node.comfyClass !== "ZImageTurboLoraStack") return;

        // Pull all slot widgets out into the bank keyed by fixed slot index
        node._slotBank = {};
        for (let i = MAX_SLOTS; i >= 1; i--) {
            const group = [];
            for (const prefix of PREFIXES) {
                const idx = node.widgets.findIndex(w => w.name === `${prefix}_${i}`);
                if (idx !== -1) group.unshift(node.widgets.splice(idx, 1)[0]);
            }
            if (group.length) node._slotBank[i] = group;
        }

        node._visibleSlots = 0;
        node.setSize([node.size[0], node.computeSize()[1]]);

        function removeSlot(slotNum) {
            // Shift values from slots above down by one
            for (let i = slotNum; i < node._visibleSlots; i++) {
                const src = node._slotBank[i + 1];
                const dst = node._slotBank[i];
                if (src && dst) {
                    for (let p = 0; p < PREFIXES.length; p++) {
                        if (dst[p] && src[p]) dst[p].value = src[p].value;
                    }
                }
            }

            // Remove the last visible slot's widgets + divider + remove btn from node.widgets
            const last = node._visibleSlots;
            const group    = node._slotBank[last];
            const divider  = node.widgets.find(w => w.name === `divider_${last}`);
            const removeBtn = node.widgets.find(w => w.name === `remove_${last}`);

            for (const w of [divider, ...( group ?? []), removeBtn].filter(Boolean)) {
                const idx = node.widgets.indexOf(w);
                if (idx !== -1) node.widgets.splice(idx, 1);
            }

            // Bank slot `last` is still intact and ready for next addSlot
            node._visibleSlots--;

            node.setSize([node.size[0], node.computeSize()[1]]);
            app.graph.setDirtyCanvas(true, false);
        }

        function addSlot() {
            const next = node._visibleSlots + 1;
            if (next > MAX_SLOTS) return;
            const group = node._slotBank[next];
            if (!group) return;

            const addBtnIdx = node.widgets.length - 1;
            let insertAt = addBtnIdx;

            if (next > 1) {
                const div = makeDivider(next);
                node.widgets.splice(insertAt, 0, div);
                insertAt++;
            }

            for (let g = 0; g < group.length; g++) {
                node.widgets.splice(insertAt + g, 0, group[g]);
            }
            insertAt += group.length;

            node.addWidget("button", `✕ Remove LoRA ${next}`, null, () => removeSlot(next));
            const rw = node.widgets.pop();
            rw.name = `remove_${next}`;
            node.widgets.splice(insertAt, 0, rw);

            node._visibleSlots = next;
            node.setSize([node.size[0], node.computeSize()[1]]);
            app.graph.setDirtyCanvas(true, false);
        }

        node.addWidget("button", "+ Add LoRA", null, addSlot);
    },

    loadedGraphNode(node) {
        if (node.comfyClass !== "ZImageTurboLoraStack") return;

        let max = 0;
        for (const w of node.widgets ?? []) {
            const m = w.name?.match(/^lora_(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1]));
        }
        node._visibleSlots = max;
    },
});
