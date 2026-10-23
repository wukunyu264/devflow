"use client";
import dynamic from "next/dynamic";
export const MarkdownContent = dynamic(() => import("./markdown").then(module => module.MarkdownContent));
