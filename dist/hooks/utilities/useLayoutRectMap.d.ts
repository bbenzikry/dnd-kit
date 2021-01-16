import { DroppableContainers, LayoutRectMap } from '../../store/types';
export declare function useLayoutRectMap(containers: DroppableContainers, disabled: boolean): {
    layoutRectMap: LayoutRectMap;
    recomputeLayouts: () => void;
    willRecomputeLayouts: boolean;
};
