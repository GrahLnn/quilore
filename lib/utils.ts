import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function partialOrder<T extends string>(relations: [T, T][]): T[] {
  const nodes = new Set<T>();
  const edges = new Map<T, Set<T>>();
  const indegree = new Map<T, number>();

  // 初始化节点与边
  for (const [a, b] of relations) {
    nodes.add(a);
    nodes.add(b);
    if (!edges.has(b)) edges.set(b, new Set());
    if (!edges.has(a)) edges.set(a, new Set());
    edges.get(b)!.add(a);
  }

  for (const node of nodes) indegree.set(node, 0);
  for (const set of edges.values())
    for (const to of set) indegree.set(to, (indegree.get(to) ?? 0) + 1);

  // 拓扑排序
  const queue: T[] = [];
  for (const [node, deg] of indegree.entries()) if (deg === 0) queue.push(node);

  const order: T[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur);
    for (const next of edges.get(cur) ?? []) {
      indegree.set(next, indegree.get(next)! - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== nodes.size) throw new Error("环状依赖，无法排序！");
  return order;
}

// 生成 z-index 映射
function genZIndexMap(
  relations: [ZN, ZN][],
  base = 10,
  step = 10
): Record<ZN, number> {
  const order = partialOrder(relations);
  const zMap = {} as Record<ZN, number>;
  for (let i = 0; i < order.length; ++i) {
    zMap[order[i]] = base + i * step;
  }
  return zMap;
}

export enum ZN {
  Modal = "modal",
  Overlay = "overlay",
  Content = "content",
  Toast = "toast",
  Dropdown = "dropdown",
}

const relations: [ZN, ZN][] = [
  [ZN.Modal, ZN.Overlay],
  [ZN.Overlay, ZN.Content],
  [ZN.Toast, ZN.Modal],
  [ZN.Dropdown, ZN.Overlay],
];

export const zMap = genZIndexMap(relations);
// export const zMap = {
//   base: 0,
//   header: 100,
//   sidebar: 200,
//   content: 300,
//   overlay: 900,
//   modal: 1000,
//   popover: 1200,
//   toast: 1500,
//   tooltip: 2000,
// } as const;
