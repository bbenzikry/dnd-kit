import { Transform } from '@dnd-kit/utilities';
import { UniqueIdentifier } from '../../../types';
import { DraggableNodes } from '../../../store';
export interface DropAnimation {
    duration: number;
    easing: string;
}
interface Arguments {
    activeId: UniqueIdentifier | null;
    animate: boolean;
    adjustScale: boolean;
    draggableNodes: DraggableNodes;
    duration: DropAnimation['duration'] | undefined;
    easing: DropAnimation['easing'] | undefined;
    node: HTMLElement | null;
    transform: Transform | undefined;
}
export declare function useDropAnimation({ animate, adjustScale, activeId, draggableNodes, duration, easing, node, transform, }: Arguments): boolean;
export {};
