import { AbstractPointerSensor, PointerSensorProps } from './AbstractPointerSensor';
export declare class PointerSensor extends AbstractPointerSensor {
    constructor(props: PointerSensorProps);
    static activators: {
        eventName: "onPointerDown";
        handler: ({ nativeEvent }: React.PointerEvent) => boolean;
    }[];
}
