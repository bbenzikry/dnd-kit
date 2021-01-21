export declare function getScrollPosition(scrollingContainer: Element): {
    isTop: boolean;
    isLeft: boolean;
    isBottom: boolean;
    isRight: boolean;
    scrollElementRect: DOMRect | {
        top: number;
        left: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    };
    maxScroll: {
        x: number;
        y: number;
    };
    minScroll: {
        x: number;
        y: number;
    };
};
