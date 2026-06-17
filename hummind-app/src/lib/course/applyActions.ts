import { Action, Block, Course, Module } from "../../components/course/types";
import { enforceModulesRequiredStructure } from "./moduleStructure";

/**
 * Helpers
 */
function cloneCourse(course: Course): Course {
  return {
    ...course,
    modules: course.modules.map((m) => ({
      ...m,
      blocks: m.blocks.map((b) => ({ ...b, data: { ...b.data } })),
    })),
  };
}

function ensureModule(course: Course, moduleId: string): void {
  const exists = course.modules.some((m) => m.id === moduleId);
  if (!exists) {
    course.modules.push({
      id: moduleId,
      title: `Module ${course.modules.length + 1}`,
      blocks: [],
    });
  }
}

function getModule(course: Course, moduleId: string): Module | undefined {
  return course.modules.find((m) => m.id === moduleId);
}

function findBlockIndex(blocks: Block[], blockId: string): number {
  return blocks.findIndex((b) => b.id === blockId);
}

function insertBlock(blocks: Block[], block: Block, afterBlockId: string | null) {
  // Prevent duplicates
  if (blocks.some((b) => b.id === block.id)) return;

  if (!afterBlockId) {
    blocks.push(block);
    return;
  }

  const idx = findBlockIndex(blocks, afterBlockId);
  if (idx === -1) {
    blocks.push(block);
    return;
  }

  blocks.splice(idx + 1, 0, block);
}

function moveBlockBetweenModules(args: {
  fromBlocks: Block[];
  toBlocks: Block[];
  blockId: string;
  toIndex: number | null;
}) {
  const { fromBlocks, toBlocks, blockId, toIndex } = args;

  const fromIdx = findBlockIndex(fromBlocks, blockId);
  if (fromIdx === -1) return;

  const [moving] = fromBlocks.splice(fromIdx, 1);
  if (!moving) return;

  if (toIndex === null || toIndex === undefined) {
    toBlocks.push(moving);
    return;
  }

  const safeIndex = Math.max(0, Math.min(toIndex, toBlocks.length));
  toBlocks.splice(safeIndex, 0, moving);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isPlaceholderRenameAction(a: Action): boolean {
  if (a.type !== "ADD_BLOCK") return false;
  if (!a.moduleTitle?.trim()) return false;
  if (a.blockId || a.afterBlockId || a.toModuleId || a.toIndex !== null) return false;

  const b = a.block;
  if (!b) return true;

  const textEmpty = !b.text?.trim();
  const titleEmpty = !b.title?.trim();
  const dataEmpty = !isPlainObject(b.data) || Object.keys(b.data).length === 0;

  return textEmpty && titleEmpty && dataEmpty;
}

function isRenameOnlyIntent(a: Action): boolean {
  if (!a.moduleTitle?.trim()) return false;
  return !a.blockId && !a.afterBlockId && !a.toModuleId && a.toIndex === null;
}

/**
 * Main
 */
export function applyActions(course: Course, actions: Action[]): Course {
  const next = cloneCourse(course);

  for (const a of actions) {
    // 1) always ensure the module exists
    ensureModule(next, a.moduleId);

    const mod = getModule(next, a.moduleId);
    if (!mod) continue;

    if (typeof a.moduleTitle === "string" && a.moduleTitle.trim()) {
      mod.title = a.moduleTitle.trim();
    }

    // L'IA peut parfois renvoyer un ADD_BLOCK vide juste pour renommer un module.
    // Dans ce cas, on garde le renommage et on ignore l'ajout de bloc parasite.
    if (isPlaceholderRenameAction(a)) {
      continue;
    }

    // Si l'intention est uniquement de renommer le module, on n'applique
    // aucune modification bloc (evite les ajouts/mises a jour parasites).
    if (isRenameOnlyIntent(a) && (a.type === "ADD_BLOCK" || a.type === "UPDATE_BLOCK")) {
      continue;
    }

    switch (a.type) {
      case "ADD_BLOCK": {
        insertBlock(mod.blocks, a.block, a.afterBlockId ?? null);
        break;
      }

      case "UPDATE_BLOCK": {
        // We'll update by a.block.id (preferred) or by blockId if provided
        const targetId = a.block?.id || a.blockId;
        if (!targetId) break;

        const idx = findBlockIndex(mod.blocks, targetId);
        if (idx === -1) break;

        mod.blocks[idx] = {
          ...mod.blocks[idx],
          ...a.block,
          data: a.block.data ?? mod.blocks[idx].data,
        };
        break;
      }

      case "DELETE_BLOCK": {
        const targetId = a.blockId || a.block?.id;
        if (!targetId) break;

        mod.blocks = mod.blocks.filter((b) => b.id !== targetId);
        break;
      }

      case "MOVE_BLOCK": {
        const targetId = a.blockId || a.block?.id;
        if (!targetId) break;

        const toModuleId = a.toModuleId ?? a.moduleId;
        ensureModule(next, toModuleId);

        const toMod = getModule(next, toModuleId);
        if (!toMod) break;

        if (toMod.id === mod.id) {
          // move inside same module
          moveBlockBetweenModules({
            fromBlocks: mod.blocks,
            toBlocks: mod.blocks,
            blockId: targetId,
            toIndex: a.toIndex ?? null,
          });
        } else {
          // move to another module
          moveBlockBetweenModules({
            fromBlocks: mod.blocks,
            toBlocks: toMod.blocks,
            blockId: targetId,
            toIndex: a.toIndex ?? null,
          });
        }
        break;
      }
    }
  }

  next.modules = enforceModulesRequiredStructure(next.modules);
  return next;
}
