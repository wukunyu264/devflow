import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type { SimulationNodeDatum } from "d3-force";
import type { TopicGraph, TopicNode } from "@/lib/topic-graph";

export type PlacedTopic = TopicNode &
  SimulationNodeDatum & {
    x: number;
    y: number;
    radius: number;
    compact: boolean;
  };

export function layoutTopics(
  graph: TopicGraph,
  compact = false,
): PlacedTopic[] {
  const width = compact ? 380 : 760;
  const height = compact ? 460 : 500;
  const nodes: PlacedTopic[] = graph.nodes
    .slice(0, compact ? 12 : 20)
    .map((node, index) => ({
      ...node,
      compact,
      x:
        width / 2 +
        Math.cos(index * 2.39996) * Math.sqrt(index + 1) * (compact ? 32 : 48),
      y: height / 2 + Math.sin(index * 2.39996) * Math.sqrt(index + 1) * 37,
      radius: Math.min(
        compact ? 28 : 34,
        (compact ? 14 : 16) + Math.sqrt(node.count) * 5,
      ),
    }));
  const ids = new Set(nodes.map((node) => node.id));
  // Compute a bounded layout once. D3 mutates these copies, never React state,
  // and its automatic timer is stopped before the synchronous ticks.
  const simulation = forceSimulation(nodes)
    .stop()
    .force(
      "link",
      forceLink<PlacedTopic, { source: string; target: string }>(
        graph.links
          .filter((link) => ids.has(link.source) && ids.has(link.target))
          .map((link) => ({ ...link })),
      )
        .id((node) => node.id)
        .distance(125)
        .strength(0.12),
    )
    .force("charge", forceManyBody().strength(compact ? -280 : -520))
    .force(
      "collision",
      forceCollide<PlacedTopic>()
        .radius((node) =>
          Math.max(node.radius + 28, Math.min(node.label.length, 12) * 4 + 12),
        )
        .iterations(3),
    )
    .force("x", forceX(width / 2).strength(compact ? 0.13 : 0.07))
    .force("y", forceY(height / 2 - 10).strength(0.12));
  simulation.tick(160);
  simulation.stop();
  return nodes.map((node) => ({
    ...node,
    x: Math.max(
      compact ? 42 : 65,
      Math.min(width - (compact ? 42 : 65), node.x),
    ),
    y: Math.max(50, Math.min(height - 75, node.y)),
  }));
}
