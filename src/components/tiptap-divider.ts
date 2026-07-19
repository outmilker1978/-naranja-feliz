import { Node } from "@tiptap/core";

export const OrangeDividerExtension = Node.create({
  name: "orangeDivider",
  group: "block",
  atom: true,
  parseHTML() {
    return [{ tag: "div[data-type='orange-divider']" }];
  },
  renderHTML() {
    return [
      "div",
      { "data-type": "orange-divider", style: "display:flex;justify-content:center;align-items:center;width:100%;height:2.5rem;margin:1.5rem 0" },
      [
        "svg",
        {
          width: "100%",
          height: "100%",
          viewBox: "0 0 400 60",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg",
          preserveAspectRatio: "xMidYMid meet",
          style: "color:#F97316;max-width:min(100%,480px)",
        },
        ["path", { d: "M 4 30 L 145 30", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round" }],
        ["path", { d: "M 145 30 L 158 21", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }],
        ["path", { d: "M 145 30 L 158 39", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }],
        ["path", { d: "M 139 24 C 132 13, 127 28, 139 24", stroke: "currentColor", "stroke-width": "1.2", "stroke-linecap": "round", fill: "none" }],
        ["path", { d: "M 141 35 C 134 44, 129 33, 141 35", stroke: "currentColor", "stroke-width": "1.2", "stroke-linecap": "round", fill: "none" }],
        ["path", { d: "M 242 30 L 396 30", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round" }],
        ["path", { d: "M 242 30 L 229 21", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }],
        ["path", { d: "M 242 30 L 229 39", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }],
        ["path", { d: "M 248 24 C 255 13, 260 28, 248 24", stroke: "currentColor", "stroke-width": "1.2", "stroke-linecap": "round", fill: "none" }],
        ["path", { d: "M 246 35 C 253 44, 258 33, 246 35", stroke: "currentColor", "stroke-width": "1.2", "stroke-linecap": "round", fill: "none" }],
        ["circle", { cx: "200", cy: "30", r: "20", stroke: "currentColor", "stroke-width": "3.5", fill: "none" }],
        ["circle", { cx: "188", cy: "22", r: "1.2", stroke: "currentColor", "stroke-width": "1.2", fill: "none" }],
        ["circle", { cx: "213", cy: "26", r: "1.2", stroke: "currentColor", "stroke-width": "1.2", fill: "none" }],
        ["circle", { cx: "192", cy: "39", r: "1.2", stroke: "currentColor", "stroke-width": "1.2", fill: "none" }],
        ["circle", { cx: "209", cy: "37", r: "1.2", stroke: "currentColor", "stroke-width": "1.2", fill: "none" }],
        ["path", { d: "M 200 10 Q 194 4, 200 0", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }],
        ["path", { d: "M 200 10 C 189 -1, 174 -1, 172 5 C 176 14, 189 16, 200 10", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }],
        ["path", { d: "M 200 10 C 211 -1, 226 -1, 228 5 C 224 14, 211 16, 200 10", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }],
      ],
    ];
  },
});
