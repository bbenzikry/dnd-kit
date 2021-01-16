export const isFixed = (elem: HTMLElement) => {
    let currentElement: HTMLElement | null = elem
    let fixed = false
    while (currentElement) {
        fixed = getComputedStyle(currentElement)?.position === 'fixed'
        if (fixed) {
            break
        }
        currentElement = currentElement?.parentElement
    }

    return fixed
}