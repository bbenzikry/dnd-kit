export declare class Listeners {
    private target;
    private listeners;
    constructor(target: HTMLElement | Document);
    add(eventName: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | false): void;
    removeAll(): void;
}
