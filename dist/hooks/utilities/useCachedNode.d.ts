import type { DraggableNode } from '../../store';
import { UniqueIdentifier } from '../../types';
export declare function useCachedNode(draggableNode: DraggableNode | null, active: UniqueIdentifier | null): DraggableNode['current'];
