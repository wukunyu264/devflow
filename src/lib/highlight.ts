import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import bash from "highlight.js/lib/languages/bash";
import type { Root, RootContent, ElementContent } from "hast";

// Explicit eight-language registry. No common/all grammar bundle or autodetection.
const highlighter = createLowlight({ javascript, typescript, python, java, sql, css, xml, bash });
highlighter.registerAlias({typescript:["ts","tsx"],javascript:["js","jsx"],xml:["html"],bash:["sh","shell"]});
export default function highlight() {
  return (tree: Root) => {
    const walk = (node: Root | RootContent, parent?: Root | RootContent) => {
      if (node.type === "element" && node.tagName === "code" && parent?.type === "element" && parent.tagName === "pre") {
        const classes = Array.isArray(node.properties.className) ? node.properties.className.map(String) : [];
        const language = classes.find(value => value.startsWith("language-"))?.slice(9);
        if (language && highlighter.registered(language)) {
          const value = node.children.map(child => child.type === "text" ? child.value : "").join("");
          node.children = highlighter.highlight(language, value).children as ElementContent[];
          node.properties.className = [...classes, "hljs"];
        }
        return;
      }
      if ("children" in node) node.children.forEach(child => walk(child, node));
    };
    walk(tree);
  };
}
