export const isFixed = (elem: HTMLElement) => {
    let currentElement: HTMLElement | null = elem
    let fixed = false
    while (currentElement) {
        fixed = getComputedStyle(currentElement)?.position === 'fixed'
        // ignore fixed elements for body and above.
        if (currentElement === document.body) {
            return false
        }
        if (fixed) {
            break
        }
        currentElement = currentElement?.parentElement
    }

    return fixed
}