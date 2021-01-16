import { ViewRect } from '../../types';
export declare function getScrollDirectionAndSpeed(scrollContainer: Element, scrollContainerRect: ViewRect, rect: ViewRect, acceleration?: number): {
    direction: {
        x: number;
        y: number;
    };
    speed: {
        x: number;
        y: number;
    };
};
