import { isScrollable } from './isScrollable';
import { isFixed } from '../position/isFixed'

export function getScrollableAncestors(element: Node | null): Element[] {
  const scrollParents: Element[] = [];

  function findScrollableAncestors(node: Node | null): Element[] {
    if (!node) {
      return scrollParents;
    }

    if (node instanceof Document && node.scrollingElement != null) {
      scrollParents.push(node.scrollingElement);

      return scrollParents;
    }

    if (!(node instanceof HTMLElement) || node instanceof SVGElement) {
      return scrollParents;
    }

    if (isScrollable(node)) {
      // crazy stupid hotfix for positioning issue under fixed scroll ancestors. get offsetTop of the first ancestor only(!)
      if (node && isFixed(node)) {
        return [node]
      }
      scrollParents.push(node);
    }

    return findScrollableAncestors(node.parentNode);
  }

  return element ? findScrollableAncestors(element) : scrollParents;
}
