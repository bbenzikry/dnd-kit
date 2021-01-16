import React, { createContext, useRef, useEffect, useCallback, useMemo, useState, memo, useReducer, useContext } from 'react';
import { createPortal } from 'react-dom';
import { canUseDOM, add, useUniqueId, useInterval, useLazyMemo, subtract, useNodeRef, useIsomorphicLayoutEffect, CSS } from '@dnd-kit/utilities';
import { useAnnouncement, HiddenText, LiveRegion } from '@dnd-kit/accessibility';

var screenReaderInstructions = {
  draggable: "\n    To pick up a draggable item, press the space bar.\n    While dragging, use the arrow keys to move the item.\n    Press space again to drop the item in its new position, or press escape to cancel.\n  "
};
var defaultAnnouncements = {
  onDragStart: function onDragStart(id) {
    return "Picked up draggable item " + id + ".";
  },
  onDragOver: function onDragOver(id, overId) {
    if (overId) {
      return "Draggable item " + id + " was moved over droppable area " + overId + ".";
    }

    return "Draggable item " + id + " is no longer over a droppable area.";
  },
  onDragEnd: function onDragEnd(id, overId) {
    if (overId) {
      return "Draggable item " + id + " was dropped over droppable area " + overId;
    }

    return "Draggable item " + id + " was dropped.";
  },
  onDragCancel: function onDragCancel(id) {
    return "Dragging was cancelled. Draggable item " + id + " was dropped.";
  }
};

var Action;

(function (Action) {
  Action["DragStart"] = "dragStart";
  Action["DragMove"] = "dragMove";
  Action["DragEnd"] = "dragEnd";
  Action["DragCancel"] = "dragCancel";
  Action["RegisterDroppable"] = "registerDroppable";
  Action["SetDroppableDisabled"] = "setDroppableDisabled";
  Action["UnregisterDroppable"] = "unregisterDroppable";
})(Action || (Action = {}));

var getMaxValueIndex = function getMaxValueIndex(array) {
  return getValueIndex(array, function (value, tracked) {
    return value > tracked;
  });
};
var getMinValueIndex = function getMinValueIndex(array) {
  return getValueIndex(array, function (value, tracked) {
    return value < tracked;
  });
};
/**
 * Returns the index of the smallest number in an array of numbers
 */

function getValueIndex(array, comparator) {
  if (array.length === 0) {
    return -1;
  }

  var tracked = array[0];
  var index = 0;

  for (var i = 1; i < array.length; i++) {
    if (comparator(array[i], tracked)) {
      index = i;
      tracked = array[i];
    }
  }

  return index;
}

function noop() {}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it;

  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      return function () {
        if (i >= o.length) return {
          done: true
        };
        return {
          done: false,
          value: o[i++]
        };
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  it = o[Symbol.iterator]();
  return it.next.bind(it);
}

function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];

  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }

  return (hint === "string" ? String : Number)(input);
}

function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");

  return typeof key === "symbol" ? key : String(key);
}

function omit(id, elements) {
  var other = _objectWithoutPropertiesLoose(elements, [id].map(_toPropertyKey));

  return other;
}

var Context = /*#__PURE__*/createContext({
  activatorEvent: null,
  active: null,
  activeNode: null,
  activeNodeRect: null,
  activeNodeClientRect: null,
  activators: [],
  ariaDescribedById: {
    draggable: ''
  },
  overlayNode: {
    nodeRef: {
      current: null
    },
    rect: null,
    setRef: noop
  },
  containerNodeRect: null,
  dispatch: noop,
  draggableNodes: {},
  droppableRects: /*#__PURE__*/new Map(),
  droppableContainers: {},
  over: null,
  scrollableAncestors: [],
  scrollableAncestorRects: [],
  recomputeLayouts: noop,
  windowRect: null,
  willRecomputeLayouts: false
});

/**
 * Returns the coordinates of the center of a given ClientRect
 */
function centerOfRectangle(rect, left, top) {
  if (left === void 0) {
    left = rect.offsetLeft;
  }

  if (top === void 0) {
    top = rect.offsetTop;
  }

  return {
    x: left + rect.width * 0.5,
    y: top + rect.height * 0.5
  };
}

var defaultCoordinates = /*#__PURE__*/Object.freeze({
  x: 0,
  y: 0
});

/**
 * Returns the distance between two points
 */
function distanceBetween(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function isTouchEvent(event) {
  var _window;

  return ((_window = window) == null ? void 0 : _window.TouchEvent) && event instanceof TouchEvent;
}

function isMouseEvent(event) {
  var _window;

  return ((_window = window) == null ? void 0 : _window.MouseEvent) && event instanceof MouseEvent || event.type.includes('mouse');
}

/**
 * Returns the normalized x and y coordinates for mouse and touch events.
 */

function getEventCoordinates(event) {
  if (isTouchEvent(event)) {
    if (event.touches && event.touches.length) {
      var _event$touches$ = event.touches[0],
          x = _event$touches$.clientX,
          y = _event$touches$.clientY;
      return {
        x: x,
        y: y
      };
    } else if (event.changedTouches && event.changedTouches.length) {
      var _event$changedTouches = event.changedTouches[0],
          _x = _event$changedTouches.clientX,
          _y = _event$changedTouches.clientY;
      return {
        x: _x,
        y: _y
      };
    }
  }

  if (isMouseEvent(event)) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }

  return {
    x: 0,
    y: 0
  };
}

function getRelativeTransformOrigin(event, rect) {
  if (event instanceof KeyboardEvent) {
    return '0 0';
  }

  var eventCoordinates = getEventCoordinates(event);
  var transformOrigin = {
    x: (eventCoordinates.x - rect.left) / rect.width * 100,
    y: (eventCoordinates.y - rect.top) / rect.height * 100
  };
  return transformOrigin.x + "% " + transformOrigin.y + "%";
}

/**
 * Returns the closest rectangle from an array of rectangles to the center of a given
 * rectangle.
 */

var closestCenter = function closestCenter(rects, rect) {
  var centerRect = centerOfRectangle(rect, rect.left, rect.top);
  var distances = rects.map(function (_ref) {
    var rect = _ref[1];
    return distanceBetween(centerOfRectangle(rect), centerRect);
  });
  var minValueIndex = getMinValueIndex(distances);
  return rects[minValueIndex] ? rects[minValueIndex][0] : null;
};

function adjustScale(transform, rect1, rect2) {
  return _extends({}, transform, {
    scaleX: rect1 && rect2 ? rect1.width / rect2.width : 1,
    scaleY: rect1 && rect2 ? rect1.height / rect2.height : 1
  });
}

function getRectDelta(rect1, rect2) {
  return rect1 && rect2 ? {
    x: rect1.left - rect2.left,
    y: rect1.top - rect2.top
  } : defaultCoordinates;
}

function createRectAdjustmentFn(modifier) {
  return function adjustViewRect(viewRect) {
    for (var _len = arguments.length, adjustments = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      adjustments[_key - 1] = arguments[_key];
    }

    return adjustments.reduce(function (acc, adjustment) {
      return _extends({}, acc, {
        top: acc.top + modifier * adjustment.y,
        bottom: acc.bottom + modifier * adjustment.y,
        left: acc.left + modifier * adjustment.x,
        right: acc.right + modifier * adjustment.x,
        offsetLeft: acc.offsetLeft + modifier * adjustment.x,
        offsetTop: acc.offsetTop + modifier * adjustment.y
      });
    }, _extends({}, viewRect));
  };
}
var getAdjustedRect = /*#__PURE__*/createRectAdjustmentFn(1);

function isScrollable(node) {
  var computedStyle = window.getComputedStyle(node);
  var overflowRegex = /(auto|scroll)/;
  var properties = ['overflow', 'overflowX', 'overflowY'];
  return properties.find(function (property) {
    var value = computedStyle[property];
    return typeof value === 'string' ? overflowRegex.test(value) : false;
  }) != null;
}

var isFixed = function isFixed(elem) {
  var currentElement = elem;
  var fixed = false;

  while (currentElement) {
    var _currentElement, _currentElement2;

    fixed = ((_currentElement = currentElement) == null ? void 0 : _currentElement.style.position) === 'fixed';

    if (fixed) {
      break;
    }

    currentElement = (_currentElement2 = currentElement) == null ? void 0 : _currentElement2.parentElement;
  }

  return fixed;
};

function getScrollableAncestors(element) {
  var scrollParents = [];

  function findScrollableAncestors(node) {
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
        return [node];
      }

      scrollParents.push(node);
    }

    return findScrollableAncestors(node.parentNode);
  }

  return element ? findScrollableAncestors(element) : scrollParents;
}

function getScrollableElement(element) {
  if (!canUseDOM) {
    return null;
  }

  if (element === document.scrollingElement || element instanceof Document) {
    return window;
  }

  if (element instanceof HTMLElement) {
    return element;
  }

  return null;
}

function getScrollCoordinates(element) {
  if (element instanceof Window) {
    return {
      x: element.scrollX,
      y: element.scrollY
    };
  }

  return {
    x: element.scrollLeft,
    y: element.scrollTop
  };
}

var Direction;

(function (Direction) {
  Direction[Direction["Forward"] = 1] = "Forward";
  Direction[Direction["Backward"] = -1] = "Backward";
})(Direction || (Direction = {}));

function getScrollElementRect(element) {
  if (element === document.scrollingElement) {
    var _window = window,
        innerWidth = _window.innerWidth,
        innerHeight = _window.innerHeight;
    return {
      top: 0,
      left: 0,
      right: innerWidth,
      bottom: innerHeight,
      width: innerWidth,
      height: innerHeight
    };
  }

  return element.getBoundingClientRect();
}

function getScrollPosition(scrollingContainer) {
  var scrollElementRect = getScrollElementRect(scrollingContainer);
  var minScroll = {
    x: 0,
    y: 0
  };
  var maxScroll = {
    x: scrollingContainer.scrollWidth - scrollElementRect.width,
    y: scrollingContainer.scrollHeight - scrollElementRect.height
  };
  var isTop = scrollingContainer.scrollTop <= minScroll.y;
  var isLeft = scrollingContainer.scrollLeft <= minScroll.x;
  var isBottom = scrollingContainer.scrollTop >= maxScroll.y;
  var isRight = scrollingContainer.scrollLeft >= maxScroll.x;
  return {
    isTop: isTop,
    isLeft: isLeft,
    isBottom: isBottom,
    isRight: isRight,
    scrollElementRect: scrollElementRect,
    maxScroll: maxScroll,
    minScroll: minScroll
  };
}

function isDocumentScrollingElement(element) {
  if (!canUseDOM || !element) {
    return false;
  }

  return element === document.scrollingElement;
}

function getScrollDirectionAndSpeed(scrollContainer, scrollContainerRect, rect, acceleration) {
  if (acceleration === void 0) {
    acceleration = 10;
  }

  var clientHeight = scrollContainer.clientHeight,
      clientWidth = scrollContainer.clientWidth;
  var finalScrollContainerRect = isDocumentScrollingElement(scrollContainer) ? {
    top: 0,
    left: 0,
    right: clientWidth,
    bottom: clientHeight
  } : scrollContainerRect;

  var _getScrollPosition = getScrollPosition(scrollContainer),
      isTop = _getScrollPosition.isTop,
      isBottom = _getScrollPosition.isBottom,
      isLeft = _getScrollPosition.isLeft,
      isRight = _getScrollPosition.isRight;

  var width = rect.width,
      height = rect.height,
      left = rect.left,
      top = rect.top,
      bottom = rect.bottom,
      right = rect.right;
  var direction = {
    x: 0,
    y: 0
  };
  var speed = {
    x: 0,
    y: 0
  };

  if (!isTop && top <= finalScrollContainerRect.top + height) {
    // Scroll Up
    direction.y = Direction.Backward;
    speed.y = acceleration * Math.abs((top - height - finalScrollContainerRect.top) / height);
  } else if (!isBottom && bottom >= finalScrollContainerRect.bottom - height) {
    // Scroll Down
    direction.y = Direction.Forward;
    speed.y = acceleration * Math.abs((finalScrollContainerRect.bottom - height - bottom) / height);
  }

  if (!isRight && right >= finalScrollContainerRect.right - width) {
    // Scroll Right
    direction.x = Direction.Forward;
    speed.x = acceleration * Math.abs((finalScrollContainerRect.right - width - right) / width);
  } else if (!isLeft && left <= finalScrollContainerRect.left + width) {
    // Scroll Left
    direction.x = Direction.Backward;
    speed.x = acceleration * Math.abs((left - width - finalScrollContainerRect.left) / width);
  }

  return {
    direction: direction,
    speed: speed
  };
}

function getScrollOffsets(scrollableAncestors) {
  return scrollableAncestors.reduce(function (acc, node) {
    return add(acc, getScrollCoordinates(node));
  }, defaultCoordinates);
}

function getEdgeOffset(node, parent, offset) {
  if (offset === void 0) {
    offset = defaultCoordinates;
  }

  if (!node || !(node instanceof HTMLElement)) {
    return offset;
  }

  var nodeOffset = {
    x: offset.x + node.offsetLeft,
    y: offset.y + node.offsetTop
  };

  if (node.offsetParent === parent) {
    return nodeOffset;
  }

  return getEdgeOffset(node.offsetParent, parent, nodeOffset);
}

function getElementLayout(element) {
  var width = element.offsetWidth,
      height = element.offsetHeight;

  var _getEdgeOffset = getEdgeOffset(element, null),
      offsetLeft = _getEdgeOffset.x,
      offsetTop = _getEdgeOffset.y;

  return {
    width: width,
    height: height,
    offsetTop: offsetTop,
    offsetLeft: offsetLeft
  };
}
function getBoundingClientRect(element) {
  if (element instanceof Window) {
    var _width = window.innerWidth;
    var _height = window.innerHeight;
    return {
      top: 0,
      left: 0,
      right: _width,
      bottom: _height,
      width: _width,
      height: _height,
      offsetTop: 0,
      offsetLeft: 0
    };
  }

  var _getElementLayout = getElementLayout(element),
      offsetTop = _getElementLayout.offsetTop,
      offsetLeft = _getElementLayout.offsetLeft;

  var _element$getBoundingC = element.getBoundingClientRect(),
      width = _element$getBoundingC.width,
      height = _element$getBoundingC.height,
      top = _element$getBoundingC.top,
      bottom = _element$getBoundingC.bottom,
      left = _element$getBoundingC.left,
      right = _element$getBoundingC.right;

  return {
    width: width,
    height: height,
    top: top,
    bottom: bottom,
    right: right,
    left: left,
    offsetTop: offsetTop,
    offsetLeft: offsetLeft
  };
}
function getViewRect(element) {
  var _getElementLayout2 = getElementLayout(element),
      width = _getElementLayout2.width,
      height = _getElementLayout2.height,
      offsetTop = _getElementLayout2.offsetTop,
      offsetLeft = _getElementLayout2.offsetLeft;

  var scrollableAncestors = getScrollableAncestors(element.parentNode);
  var scrollOffsets = getScrollOffsets(scrollableAncestors);
  var top = offsetTop - scrollOffsets.y;
  var left = offsetLeft - scrollOffsets.x;
  return {
    width: width,
    height: height,
    top: top,
    bottom: top + height,
    right: left + width,
    left: left,
    offsetTop: offsetTop,
    offsetLeft: offsetLeft
  };
}

function isViewRect(entry) {
  return 'top' in entry;
}

/**
 * Returns the coordinates of the corners of a given rectangle:
 * [TopLeft {x, y}, TopRight {x, y}, BottomLeft {x, y}, BottomRight {x, y}]
 */

function cornersOfRectangle(rect, left, top) {
  if (left === void 0) {
    left = rect.offsetLeft;
  }

  if (top === void 0) {
    top = rect.offsetTop;
  }

  return [{
    x: left,
    y: top
  }, {
    x: left + rect.width,
    y: top
  }, {
    x: left,
    y: top + rect.height
  }, {
    x: left + rect.width,
    y: top + rect.height
  }];
}
/**
 * Returns the closest rectangle from an array of rectangles to the corners of
 * another rectangle.
 */


var closestCorners = function closestCorners(entries, target) {
  var corners = cornersOfRectangle(target, target.left, target.top);
  var distances = entries.map(function (_ref) {
    var entry = _ref[1];
    var entryCorners = cornersOfRectangle(entry, isViewRect(entry) ? entry.left : undefined, isViewRect(entry) ? entry.top : undefined);
    var distances = corners.reduce(function (accumulator, corner, index) {
      return accumulator + distanceBetween(entryCorners[index], corner);
    }, 0);
    return Number((distances / 4).toFixed(4));
  });
  var minValueIndex = getMinValueIndex(distances);
  return entries[minValueIndex] ? entries[minValueIndex][0] : null;
};

/**
 * Returns the intersecting rectangle area between two rectangles
 */

function getIntersectionRatio(entry, target) {
  var top = Math.max(target.top, entry.offsetTop);
  var left = Math.max(target.left, entry.offsetLeft);
  var right = Math.min(target.left + target.width, entry.offsetLeft + entry.width);
  var bottom = Math.min(target.top + target.height, entry.offsetTop + entry.height);
  var width = right - left;
  var height = bottom - top;

  if (left < right && top < bottom) {
    var targetArea = target.width * target.height;
    var entryArea = entry.width * entry.height;
    var intersectionArea = width * height;
    var intersectionRatio = intersectionArea / (targetArea + entryArea - intersectionArea);
    return Number(intersectionRatio.toFixed(4));
  } // Rectangles do not overlap, or overlap has an area of zero (edge/corner overlap)


  return 0;
}
/**
 * Returns the rectangle that has the greatest intersection area with a given
 * rectangle in an array of rectangles.
 */


var rectIntersection = function rectIntersection(entries, target) {
  var intersections = entries.map(function (_ref) {
    var entry = _ref[1];
    return getIntersectionRatio(entry, target);
  });
  var maxValueIndex = getMaxValueIndex(intersections);

  if (intersections[maxValueIndex] <= 0) {
    return null;
  }

  return entries[maxValueIndex] ? entries[maxValueIndex][0] : null;
};

function getOwnerDocument(target) {
  return target instanceof HTMLElement ? target.ownerDocument : document;
}

function getInitialState() {
  return {
    draggable: {
      active: null,
      initialCoordinates: {
        x: 0,
        y: 0
      },
      lastEvent: null,
      nodes: {},
      translate: {
        x: 0,
        y: 0
      }
    },
    droppable: {
      containers: {}
    }
  };
}
function reducer(state, action) {
  switch (action.type) {
    case Action.DragStart:
      return _extends({}, state, {
        draggable: _extends({}, state.draggable, {
          initialCoordinates: action.initialCoordinates,
          active: action.active,
          lastEvent: Action.DragStart
        })
      });

    case Action.DragMove:
      if (!state.draggable.active) {
        return state;
      }

      return _extends({}, state, {
        draggable: _extends({}, state.draggable, {
          translate: {
            x: action.coordinates.x - state.draggable.initialCoordinates.x,
            y: action.coordinates.y - state.draggable.initialCoordinates.y
          }
        })
      });

    case Action.DragEnd:
    case Action.DragCancel:
      return _extends({}, state, {
        draggable: _extends({}, state.draggable, {
          active: null,
          initialCoordinates: {
            x: 0,
            y: 0
          },
          translate: {
            x: 0,
            y: 0
          },
          lastEvent: action.type
        })
      });

    case Action.RegisterDroppable:
      {
        var _extends2;

        var element = action.element;
        var id = element.id;
        return _extends({}, state, {
          droppable: _extends({}, state.droppable, {
            containers: _extends({}, state.droppable.containers, (_extends2 = {}, _extends2[id] = element, _extends2))
          })
        });
      }

    case Action.SetDroppableDisabled:
      {
        var _extends3;

        var _id = action.id,
            disabled = action.disabled;
        var _element = state.droppable.containers[_id];

        if (!_element) {
          return state;
        }

        return _extends({}, state, {
          droppable: _extends({}, state.droppable, {
            containers: _extends({}, state.droppable.containers, (_extends3 = {}, _extends3[_id] = _extends({}, _element, {
              disabled: disabled
            }), _extends3))
          })
        });
      }

    case Action.UnregisterDroppable:
      {
        var _id2 = action.id;
        return _extends({}, state, {
          droppable: _extends({}, state.droppable, {
            containers: omit(_id2, state.droppable.containers)
          })
        });
      }

    default:
      {
        return state;
      }
  }
}

function Accessibility(_ref) {
  var _ref$announcements = _ref.announcements,
      announcements = _ref$announcements === void 0 ? defaultAnnouncements : _ref$announcements,
      activeId = _ref.activeId,
      overId = _ref.overId,
      lastEvent = _ref.lastEvent,
      hiddenTextDescribedById = _ref.hiddenTextDescribedById,
      screenReaderInstructions = _ref.screenReaderInstructions;

  var _useAnnouncement = useAnnouncement(),
      announce = _useAnnouncement.announce,
      entries = _useAnnouncement.entries;

  var tracked = useRef({
    activeId: activeId,
    overId: overId
  });
  var liveRegionId = useUniqueId("DndLiveRegion");
  useEffect(function () {
    var _tracked$current = tracked.current,
        previousActiveId = _tracked$current.activeId,
        previousOverId = _tracked$current.overId;
    var announcement;

    if (!previousActiveId && activeId) {
      announcement = announcements.onDragStart(activeId);
    } else if (!activeId && previousActiveId) {
      if (lastEvent === Action.DragEnd) {
        announcement = announcements.onDragEnd(previousActiveId, previousOverId != null ? previousOverId : undefined);
      } else if (lastEvent === Action.DragCancel) {
        announcement = announcements.onDragCancel(previousActiveId);
      }
    } else if (activeId && previousActiveId && overId !== previousOverId) {
      announcement = announcements.onDragOver(activeId, overId != null ? overId : undefined);
    }

    if (announcement) {
      announce(announcement);
    }

    if (tracked.current.overId !== overId || tracked.current.activeId !== activeId) {
      tracked.current = {
        activeId: activeId,
        overId: overId
      };
    }
  }, [announcements, announce, activeId, overId, lastEvent]);
  return canUseDOM ? createPortal(React.createElement(React.Fragment, null, React.createElement(HiddenText, {
    id: hiddenTextDescribedById,
    value: screenReaderInstructions.draggable
  }), React.createElement(LiveRegion, {
    id: liveRegionId,
    entries: entries
  })), document.body) : null;
}

function useAutoScroller(_ref) {
  var disabled = _ref.disabled,
      draggingRect = _ref.draggingRect,
      _ref$interval = _ref.interval,
      interval = _ref$interval === void 0 ? 5 : _ref$interval,
      scrollableAncestors = _ref.scrollableAncestors,
      scrollableAncestorRects = _ref.scrollableAncestorRects;

  var _useInterval = useInterval(),
      setAutoScrollInterval = _useInterval[0],
      clearAutoScrollInterval = _useInterval[1];

  var scrollSpeed = useRef({
    x: 1,
    y: 1
  });
  var scrollDirection = useRef(defaultCoordinates);
  var scrollContainerRef = useRef(null);
  var autoScroll = useCallback(function () {
    var scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    var scrollLeft = scrollSpeed.current.x * scrollDirection.current.x;
    var scrollTop = scrollSpeed.current.y * scrollDirection.current.y;
    scrollContainer.scrollBy(scrollLeft, scrollTop);
  }, []);
  useEffect(function () {
    if (disabled || !scrollableAncestors.length || !draggingRect) {
      clearAutoScrollInterval();
      return;
    }

    for (var _iterator = _createForOfIteratorHelperLoose(scrollableAncestors), _step; !(_step = _iterator()).done;) {
      var scrollContainer = _step.value;
      var index = scrollableAncestors.indexOf(scrollContainer);
      var scrolllContainerRect = scrollableAncestorRects[index];

      if (!scrolllContainerRect) {
        continue;
      }

      var _getScrollDirectionAn = getScrollDirectionAndSpeed(scrollContainer, scrolllContainerRect, draggingRect),
          direction = _getScrollDirectionAn.direction,
          speed = _getScrollDirectionAn.speed;

      scrollSpeed.current = speed;
      scrollDirection.current = direction;
      clearAutoScrollInterval();

      if (speed.x > 0 || speed.y > 0) {
        scrollContainerRef.current = scrollContainer;
        setAutoScrollInterval(autoScroll, interval);
        break;
      }
    }
  }, [autoScroll, draggingRect, clearAutoScrollInterval, disabled, setAutoScrollInterval, scrollableAncestors, scrollableAncestorRects, interval]);
}

function useCachedNode(draggableNode, active) {
  return useLazyMemo(function (cachedNode) {
    var _ref, _draggableNode$curren;

    if (active === null) {
      return null;
    } // In some cases, the draggable node can unmount while dragging
    // This is the case for virtualized lists. In those situations,
    // we fall back to the last known value for that node.


    return (_ref = (_draggableNode$curren = draggableNode == null ? void 0 : draggableNode.current) != null ? _draggableNode$curren : cachedNode) != null ? _ref : null;
  }, [draggableNode, active]);
}

function useCombineActivators(sensors, getSyntheticHandler) {
  return useMemo(function () {
    return sensors.reduce(function (accumulator, sensor) {
      var Sensor = sensor.sensor;
      var sensorActivators = Sensor.activators.map(function (activator) {
        return {
          eventName: activator.eventName,
          handler: getSyntheticHandler(activator.handler, sensor)
        };
      });
      return [].concat(accumulator, sensorActivators);
    }, []);
  }, [sensors, getSyntheticHandler]);
}

function useFindElementFromPoint(coordinates, document) {
  // To-do: This is expensive and needs to be debounced
  return useMemo(function () {
    if (!document) {
      return null;
    }

    return document.elementFromPoint(coordinates.x, coordinates.y);
  }, [coordinates.x, coordinates.y, document]);
}

var defaultValue = /*#__PURE__*/new Map();
function useLayoutRectMap(containers, disabled) {
  var _useState = useState(false),
      willRecomputeLayouts = _useState[0],
      setWillRecomputeLayouts = _useState[1];

  var containersRef = useRef(containers);
  var recomputeLayouts = useCallback(function () {
    setWillRecomputeLayouts(true);
  }, []);
  var layoutRectMap = useLazyMemo(function (previousValue) {
    if (disabled) {
      return defaultValue;
    }

    if (!previousValue || previousValue === defaultValue || containersRef.current !== containers || willRecomputeLayouts) {
      for (var _i = 0, _Object$values = Object.values(containers); _i < _Object$values.length; _i++) {
        var container = _Object$values[_i];

        if (!container) {
          continue;
        }

        container.rect.current = container.node.current ? getElementLayout(container.node.current) : null;
      }

      return createLayoutRectMap(containers);
    }

    return previousValue;
  }, [containers, disabled, willRecomputeLayouts]);
  useEffect(function () {
    containersRef.current = containers;
  }, [containers]);
  useEffect(function () {
    if (willRecomputeLayouts) {
      setWillRecomputeLayouts(false);
    }
  }, [willRecomputeLayouts]);
  return {
    layoutRectMap: layoutRectMap,
    recomputeLayouts: recomputeLayouts,
    willRecomputeLayouts: willRecomputeLayouts
  };
}

function createLayoutRectMap(containers) {
  var layoutRectMap = new Map();

  if (containers) {
    for (var _i2 = 0, _Object$values2 = Object.values(containers); _i2 < _Object$values2.length; _i2++) {
      var container = _Object$values2[_i2];

      if (!container) {
        continue;
      }

      var id = container.id,
          rect = container.rect,
          disabled = container.disabled;

      if (disabled || rect.current == null) {
        continue;
      }

      layoutRectMap.set(id, rect.current);
    }
  }

  return layoutRectMap;
}

function useScrollOffsets(elements) {
  var _useState = useState(null),
      scrollCoordinates = _useState[0],
      setScrollCoordinates = _useState[1];

  var prevElements = useRef(elements); // To-do: Throttle the handleScroll callback

  var handleScroll = useCallback(function (event) {
    var scrollingElement = getScrollableElement(event.target);

    if (!scrollingElement) {
      return;
    }

    setScrollCoordinates(function (scrollCoordinates) {
      if (!scrollCoordinates) {
        return null;
      }

      scrollCoordinates.set(scrollingElement, getScrollCoordinates(scrollingElement));
      return new Map(scrollCoordinates);
    });
  }, []);
  useEffect(function () {
    var previousElements = prevElements.current;

    if (elements !== previousElements) {
      cleanup(previousElements);
      var entries = elements.map(function (element) {
        var scrollableElement = getScrollableElement(element);

        if (scrollableElement) {
          scrollableElement.addEventListener('scroll', handleScroll, {
            passive: true
          });
          return [scrollableElement, getScrollCoordinates(scrollableElement)];
        }

        return null;
      }).filter(function (entry) {
        return entry != null;
      });
      setScrollCoordinates(entries.length ? new Map(entries) : null);
      prevElements.current = elements;
    }

    return function () {
      cleanup(elements);
      cleanup(previousElements);
    };

    function cleanup(elements) {
      elements.forEach(function (element) {
        var scrollableElement = getScrollableElement(element);
        scrollableElement == null ? void 0 : scrollableElement.removeEventListener('scroll', handleScroll);
      });
    }
  }, [handleScroll, elements]);
  return useMemo(function () {
    if (elements.length) {
      return scrollCoordinates ? Array.from(scrollCoordinates.values()).reduce(function (acc, coordinates) {
        return add(acc, coordinates);
      }, defaultCoordinates) : getScrollOffsets(elements);
    }

    return defaultCoordinates;
  }, [elements, scrollCoordinates]);
}

var defaultValue$1 = [];
function useScrollableAncestors(node) {
  var previousNode = useRef(node);
  var ancestors = useLazyMemo(function (previousValue) {
    if (!node) {
      return defaultValue$1;
    }

    if (previousValue && node && previousNode.current && node.parentNode === previousNode.current.parentNode) {
      return previousValue;
    }

    return getScrollableAncestors(node);
  }, [node]);
  useEffect(function () {
    previousNode.current = node;
  }, [node]);
  return ancestors;
}

function useSyntheticListeners(listeners, id) {
  return useMemo(function () {
    return listeners.reduce(function (acc, _ref) {
      var eventName = _ref.eventName,
          handler = _ref.handler;

      acc[eventName] = function (event) {
        handler(event, id);
      };

      return acc;
    }, {});
  }, [listeners, id]);
}

var useClientRect = /*#__PURE__*/createUseRectFn(getBoundingClientRect);
var useClientRects = /*#__PURE__*/createUseRectsFn(getBoundingClientRect);
var useViewRect = /*#__PURE__*/createUseRectFn(getViewRect);

function createUseRectFn(getRect) {
  return function useClientRect(element, forceRecompute) {
    var previousElement = useRef(element);
    return useLazyMemo(function (previousValue) {
      if (!element) {
        return null;
      }

      if (forceRecompute || !previousValue && element || element !== previousElement.current) {
        if (element instanceof HTMLElement && element.parentNode == null) {
          return null;
        }

        return getRect(element);
      }

      return previousValue != null ? previousValue : null;
    }, [element, forceRecompute]);
  };
}

function createUseRectsFn(getRect) {
  var defaultValue = [];
  return function useRects(elements, forceRecompute) {
    var previousElements = useRef(elements);
    return useLazyMemo(function (previousValue) {
      if (!elements.length) {
        return defaultValue;
      }

      if (forceRecompute || !previousValue && elements.length || elements !== previousElements.current) {
        return elements.map(function (element) {
          return getRect(element);
        });
      }

      return previousValue != null ? previousValue : defaultValue;
    }, [elements, forceRecompute]);
  };
}

function useSensor(sensor, options) {
  return useMemo(function () {
    return {
      sensor: sensor,
      options: options != null ? options : {}
    };
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [sensor, options]);
}

function useSensors() {
  for (var _len = arguments.length, sensors = new Array(_len), _key = 0; _key < _len; _key++) {
    sensors[_key] = arguments[_key];
  }

  return useMemo(function () {
    return [].concat(sensors).filter(function (sensor) {
      return sensor != null;
    });
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [].concat(sensors));
}

var Listeners = /*#__PURE__*/function () {
  function Listeners(target) {
    this.target = target;
    this.listeners = [];
  }

  var _proto = Listeners.prototype;

  _proto.add = function add(eventName, handler, options) {
    this.target.addEventListener(eventName, handler, options);
    this.listeners.push({
      eventName: eventName,
      handler: handler
    });
  };

  _proto.removeAll = function removeAll() {
    var _this = this;

    this.listeners.forEach(function (_ref) {
      var eventName = _ref.eventName,
          handler = _ref.handler;
      return _this.target.removeEventListener(eventName, handler);
    });
  };

  return Listeners;
}();

function getEventListenerTarget(element) {
  return element instanceof HTMLElement ? element : getOwnerDocument(element);
}

var KeyboardCode;

(function (KeyboardCode) {
  KeyboardCode["Space"] = "Space";
  KeyboardCode["Down"] = "ArrowDown";
  KeyboardCode["Right"] = "ArrowRight";
  KeyboardCode["Left"] = "ArrowLeft";
  KeyboardCode["Up"] = "ArrowUp";
  KeyboardCode["Esc"] = "Escape";
  KeyboardCode["Enter"] = "Enter";
})(KeyboardCode || (KeyboardCode = {}));

var defaultKeyboardCodes = {
  start: [KeyboardCode.Space, KeyboardCode.Enter],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter]
};
var defaultKeyboardCoordinateGetter = function defaultKeyboardCoordinateGetter(event, _ref) {
  var currentCoordinates = _ref.currentCoordinates;

  switch (event.code) {
    case KeyboardCode.Right:
      return _extends({}, currentCoordinates, {
        x: currentCoordinates.x + 25
      });

    case KeyboardCode.Left:
      return _extends({}, currentCoordinates, {
        x: currentCoordinates.x - 25
      });

    case KeyboardCode.Down:
      return _extends({}, currentCoordinates, {
        y: currentCoordinates.y + 25
      });

    case KeyboardCode.Up:
      return _extends({}, currentCoordinates, {
        y: currentCoordinates.y - 25
      });
  }

  return undefined;
};

var KeyboardSensor = /*#__PURE__*/function () {
  function KeyboardSensor(props) {
    this.props = props;
    this.autoScrollEnabled = false;
    this.coordinates = defaultCoordinates;
    var target = props.event.target;
    this.props = props;
    this.listeners = new Listeners(getOwnerDocument(target));
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.attach();
  }

  var _proto = KeyboardSensor.prototype;

  _proto.attach = function attach() {
    var _this = this;

    this.handleStart();
    setTimeout(function () {
      return _this.listeners.add('keydown', _this.handleKeyDown);
    });
  };

  _proto.handleStart = function handleStart() {
    var _this$props = this.props,
        activeNode = _this$props.activeNode,
        onStart = _this$props.onStart;

    if (!activeNode.current) {
      throw new Error('Active draggable node is undefined');
    }

    var activeNodeRect = getBoundingClientRect(activeNode.current);
    var coordinates = {
      x: activeNodeRect.left,
      y: activeNodeRect.top
    };
    this.coordinates = coordinates;
    onStart(coordinates);
  };

  _proto.handleKeyDown = function handleKeyDown(event) {
    if (event instanceof KeyboardEvent) {
      var coordinates = this.coordinates;
      var _this$props2 = this.props,
          active = _this$props2.active,
          context = _this$props2.context,
          options = _this$props2.options;
      var _options$keyboardCode = options.keyboardCodes,
          keyboardCodes = _options$keyboardCode === void 0 ? defaultKeyboardCodes : _options$keyboardCode,
          _options$coordinateGe = options.coordinateGetter,
          coordinateGetter = _options$coordinateGe === void 0 ? defaultKeyboardCoordinateGetter : _options$coordinateGe,
          _options$scrollBehavi = options.scrollBehavior,
          scrollBehavior = _options$scrollBehavi === void 0 ? 'smooth' : _options$scrollBehavi;
      var code = event.code;

      if (keyboardCodes.end.includes(code)) {
        this.handleEnd(event);
        return;
      }

      if (keyboardCodes.cancel.includes(code)) {
        this.handleCancel(event);
        return;
      }

      var newCoordinates = coordinateGetter(event, {
        active: active,
        context: context.current,
        currentCoordinates: coordinates
      });

      if (newCoordinates) {
        var scrollDelta = {
          x: 0,
          y: 0
        };
        var scrollableAncestors = context.current.scrollableAncestors;
        var scrollContainer = scrollableAncestors[0];

        if (scrollContainer) {
          var direction = event.code;
          var coordinatesDelta = subtract(newCoordinates, coordinates);

          var _getScrollPosition = getScrollPosition(scrollContainer),
              isTop = _getScrollPosition.isTop,
              isRight = _getScrollPosition.isRight,
              isLeft = _getScrollPosition.isLeft,
              isBottom = _getScrollPosition.isBottom,
              scrollElementRect = _getScrollPosition.scrollElementRect,
              maxScroll = _getScrollPosition.maxScroll,
              minScroll = _getScrollPosition.minScroll;

          var clampedCoordinates = {
            x: Math.min(direction === KeyboardCode.Right ? scrollElementRect.right - scrollElementRect.width / 2 : scrollElementRect.right, Math.max(direction === KeyboardCode.Right ? scrollElementRect.left : scrollElementRect.left + scrollElementRect.width / 2, newCoordinates.x)),
            y: Math.min(direction === KeyboardCode.Down ? scrollElementRect.bottom - scrollElementRect.height / 2 : scrollElementRect.bottom, Math.max(direction === KeyboardCode.Down ? scrollElementRect.top : scrollElementRect.top + scrollElementRect.height / 2, newCoordinates.y))
          };
          var canScrollX = direction === KeyboardCode.Right && !isRight || direction === KeyboardCode.Left && !isLeft;
          var canScrollY = direction === KeyboardCode.Down && !isBottom || direction === KeyboardCode.Up && !isTop;

          if (canScrollX && clampedCoordinates.x !== newCoordinates.x) {
            var canFullyScrollToNewCoordinates = direction === KeyboardCode.Right && scrollContainer.scrollLeft + coordinatesDelta.x <= maxScroll.x || direction === KeyboardCode.Left && scrollContainer.scrollLeft + coordinatesDelta.x >= minScroll.x;

            if (canFullyScrollToNewCoordinates) {
              // We don't need to update coordinates, the scroll adjustment alone will trigger
              // logic to auto-detect the new container we are over
              scrollContainer.scrollBy({
                left: coordinatesDelta.x,
                behavior: scrollBehavior
              });
              return;
            }

            scrollDelta.x = direction === KeyboardCode.Right ? scrollContainer.scrollLeft - maxScroll.x : scrollContainer.scrollLeft - minScroll.x;
            scrollContainer.scrollBy({
              left: -scrollDelta.x,
              behavior: scrollBehavior
            });
          } else if (canScrollY && clampedCoordinates.y !== newCoordinates.y) {
            var _canFullyScrollToNewCoordinates = direction === KeyboardCode.Down && scrollContainer.scrollTop + coordinatesDelta.y <= maxScroll.y || direction === KeyboardCode.Up && scrollContainer.scrollTop + coordinatesDelta.y >= minScroll.y;

            if (_canFullyScrollToNewCoordinates) {
              // We don't need to update coordinates, the scroll adjustment alone will trigger
              // logic to auto-detect the new container we are over
              scrollContainer.scrollBy({
                top: coordinatesDelta.y,
                behavior: scrollBehavior
              });
              return;
            }

            scrollDelta.y = direction === KeyboardCode.Down ? scrollContainer.scrollTop - maxScroll.y : scrollContainer.scrollTop - minScroll.y;
            scrollContainer.scrollBy({
              top: -scrollDelta.y,
              behavior: scrollBehavior
            });
          }
        }

        this.handleMove(event, add(newCoordinates, scrollDelta));
      }
    }
  };

  _proto.handleMove = function handleMove(event, coordinates) {
    var onMove = this.props.onMove;
    event.preventDefault();
    onMove(coordinates);
    this.coordinates = coordinates;
  };

  _proto.handleEnd = function handleEnd(event) {
    var onEnd = this.props.onEnd;
    event.preventDefault();
    this.detach();
    onEnd();
  };

  _proto.handleCancel = function handleCancel(event) {
    var onCancel = this.props.onCancel;
    event.preventDefault();
    this.detach();
    onCancel();
  };

  _proto.detach = function detach() {
    this.listeners.removeAll();
  };

  return KeyboardSensor;
}();
KeyboardSensor.activators = [{
  eventName: 'onKeyDown',
  handler: function handler(event, _ref) {
    var _ref$keyboardCodes = _ref.keyboardCodes,
        keyboardCodes = _ref$keyboardCodes === void 0 ? defaultKeyboardCodes : _ref$keyboardCodes;
    var code = event.nativeEvent.code;

    if (keyboardCodes.start.includes(code)) {
      event.preventDefault();
      return true;
    }

    return false;
  }
}];

function isDistanceConstraint(constraint) {
  return Boolean(constraint && 'distance' in constraint);
}

function isDelayConstraint(constraint) {
  return Boolean(constraint && 'delay' in constraint);
}

var EventName;

(function (EventName) {
  EventName["Keydown"] = "keydown";
})(EventName || (EventName = {}));

var AbstractPointerSensor = /*#__PURE__*/function () {
  function AbstractPointerSensor(props, events, listenerTarget) {
    if (listenerTarget === void 0) {
      listenerTarget = getEventListenerTarget(props.event.target);
    }

    this.props = props;
    this.events = events;
    this.autoScrollEnabled = true;
    this.activated = false;
    this.timeoutId = null;
    var event = props.event;
    this.props = props;
    this.events = events;
    this.ownerDocument = getOwnerDocument(event.target);
    this.listeners = new Listeners(listenerTarget);
    this.initialCoordinates = getEventCoordinates(event);
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.attach();
  }

  var _proto = AbstractPointerSensor.prototype;

  _proto.attach = function attach() {
    var events = this.events,
        activationConstraint = this.props.options.activationConstraint;
    this.listeners.add(events.move.name, this.handleMove, false);
    this.listeners.add(events.end.name, this.handleEnd);
    this.ownerDocument.addEventListener(EventName.Keydown, this.handleKeydown);

    if (activationConstraint) {
      if (isDistanceConstraint(activationConstraint)) {
        return;
      }

      if (isDelayConstraint(activationConstraint)) {
        this.timeoutId = setTimeout(this.handleStart, activationConstraint.delay);
        return;
      }
    }

    this.handleStart();
  };

  _proto.detach = function detach() {
    this.listeners.removeAll();
    this.ownerDocument.removeEventListener(EventName.Keydown, this.handleKeydown);

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  };

  _proto.handleStart = function handleStart() {
    var initialCoordinates = this.initialCoordinates;
    var onStart = this.props.onStart;

    if (initialCoordinates) {
      this.activated = true;
      onStart(initialCoordinates);
    }
  };

  _proto.handleMove = function handleMove(event) {
    var activated = this.activated,
        initialCoordinates = this.initialCoordinates,
        props = this.props;
    var onMove = props.onMove,
        activationConstraint = props.options.activationConstraint;

    if (!initialCoordinates) {
      return;
    }

    var coordinates = getEventCoordinates(event);
    var delta = subtract(initialCoordinates, coordinates);
    var combinedDelta = Math.abs(delta.x) + Math.abs(delta.y);

    if (!activated && activationConstraint) {
      // Constraint validation
      if (isDelayConstraint(activationConstraint)) {
        if (combinedDelta >= activationConstraint.tolerance) {
          return this.handleCancel();
        }

        return;
      }

      if (isDistanceConstraint(activationConstraint)) {
        if (combinedDelta >= activationConstraint.distance) {
          return this.handleStart();
        }

        return;
      }
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    onMove(coordinates);
  };

  _proto.handleEnd = function handleEnd() {
    var onEnd = this.props.onEnd;
    this.detach();
    onEnd();
  };

  _proto.handleCancel = function handleCancel() {
    var onCancel = this.props.onCancel;
    this.detach();
    onCancel();
  };

  _proto.handleKeydown = function handleKeydown(event) {
    if (event.code === KeyboardCode.Esc) {
      this.handleCancel();
    }
  };

  return AbstractPointerSensor;
}();

var events = {
  move: {
    name: 'pointermove'
  },
  end: {
    name: 'pointerup'
  }
};
var PointerSensor = /*#__PURE__*/function (_AbstractPointerSenso) {
  _inheritsLoose(PointerSensor, _AbstractPointerSenso);

  function PointerSensor(props) {
    var event = props.event; // Pointer events stop firing if the target is unmounted while dragging
    // Therefore we attach listeners to the owner document instead

    var listenerTarget = getOwnerDocument(event.target);
    return _AbstractPointerSenso.call(this, props, events, listenerTarget) || this;
  }

  return PointerSensor;
}(AbstractPointerSensor);
PointerSensor.activators = [{
  eventName: 'onPointerDown',
  handler: function handler(_ref) {
    var nativeEvent = _ref.nativeEvent;

    if (!nativeEvent.isPrimary || nativeEvent.button !== 0) {
      return false;
    }

    nativeEvent.preventDefault();
    return true;
  }
}];

var events$1 = {
  move: {
    name: 'mousemove'
  },
  end: {
    name: 'mouseup'
  }
};
var MouseButton;

(function (MouseButton) {
  MouseButton[MouseButton["RightClick"] = 2] = "RightClick";
})(MouseButton || (MouseButton = {}));

var MouseSensor = /*#__PURE__*/function (_AbstractPointerSenso) {
  _inheritsLoose(MouseSensor, _AbstractPointerSenso);

  function MouseSensor(props) {
    return _AbstractPointerSenso.call(this, props, events$1, getOwnerDocument(props.event.target)) || this;
  }

  return MouseSensor;
}(AbstractPointerSensor);
MouseSensor.activators = [{
  eventName: 'onMouseDown',
  handler: function handler(_ref) {
    var nativeEvent = _ref.nativeEvent;

    if (nativeEvent.button === MouseButton.RightClick) {
      return false;
    }

    nativeEvent.preventDefault();
    return true;
  }
}];

var events$2 = {
  move: {
    name: 'touchmove'
  },
  end: {
    name: 'touchend'
  }
};
var TouchSensor = /*#__PURE__*/function (_AbstractPointerSenso) {
  _inheritsLoose(TouchSensor, _AbstractPointerSenso);

  function TouchSensor(props) {
    return _AbstractPointerSenso.call(this, props, events$2) || this;
  }

  return TouchSensor;
}(AbstractPointerSensor);
TouchSensor.activators = [{
  eventName: 'onTouchStart',
  handler: function handler(_ref) {
    var nativeEvent = _ref.nativeEvent;
    var touches = nativeEvent.touches;

    if (touches.length > 1) {
      return false;
    }

    if (nativeEvent.cancelable) {
      nativeEvent.preventDefault();
    }

    return true;
  }
}];

function applyModifiers(modifiers, _ref) {
  var transform = _ref.transform,
      args = _objectWithoutPropertiesLoose(_ref, ["transform"]);

  return (modifiers == null ? void 0 : modifiers.length) ? modifiers.reduce(function (accumulator, modifier) {
    return modifier(_extends({
      transform: accumulator
    }, args));
  }, transform) : transform;
}

var defaultSensors = [{
  sensor: PointerSensor,
  options: {}
}, {
  sensor: KeyboardSensor,
  options: {}
}];
var ActiveDraggableContext = /*#__PURE__*/createContext( /*#__PURE__*/_extends({}, defaultCoordinates, {
  scaleX: 1,
  scaleY: 1
}));
var DndContext = /*#__PURE__*/memo(function DndContext(_ref) {
  var _ref$autoScroll = _ref.autoScroll,
      autoScroll = _ref$autoScroll === void 0 ? true : _ref$autoScroll,
      announcements = _ref.announcements,
      children = _ref.children,
      _ref$sensors = _ref.sensors,
      sensors = _ref$sensors === void 0 ? defaultSensors : _ref$sensors,
      _ref$collisionDetecti = _ref.collisionDetection,
      collisionDetection = _ref$collisionDetecti === void 0 ? rectIntersection : _ref$collisionDetecti,
      _ref$screenReaderInst = _ref.screenReaderInstructions,
      screenReaderInstructions$1 = _ref$screenReaderInst === void 0 ? screenReaderInstructions : _ref$screenReaderInst,
      modifiers = _ref.modifiers,
      props = _objectWithoutPropertiesLoose(_ref, ["autoScroll", "announcements", "children", "sensors", "collisionDetection", "screenReaderInstructions", "modifiers"]);

  var store = useReducer(reducer, undefined, getInitialState);
  var state = store[0],
      dispatch = store[1];
  var _state$draggable = state.draggable,
      active = _state$draggable.active,
      lastEvent = _state$draggable.lastEvent,
      draggableNodes = _state$draggable.nodes,
      translate = _state$draggable.translate,
      droppableContainers = state.droppable.containers;
  var activeRef = useRef(null);

  var _useState = useState(null),
      activeSensor = _useState[0],
      setActiveSensor = _useState[1];

  var _useState2 = useState(null),
      activatorEvent = _useState2[0],
      setActivatorEvent = _useState2[1];

  var latestProps = useRef(props);
  var draggableDescribedById = useUniqueId("DndDescribedBy");

  var _useLayoutRectMap = useLayoutRectMap(droppableContainers, active === null),
      droppableRects = _useLayoutRectMap.layoutRectMap,
      recomputeLayouts = _useLayoutRectMap.recomputeLayouts,
      willRecomputeLayouts = _useLayoutRectMap.willRecomputeLayouts;

  var activeNode = useCachedNode(getDraggableNode(active, draggableNodes), active);
  var activeNodeRect = useViewRect(activeNode);
  var activeNodeClientRect = useClientRect(activeNode);
  var initialActiveNodeRectRef = useRef(null);
  var initialActiveNodeRect = initialActiveNodeRectRef.current;
  var nodeRectDelta = getRectDelta(activeNodeRect, initialActiveNodeRect);
  var tracked = useRef({
    active: active,
    droppableRects: droppableRects,
    overId: null,
    scrollAdjustedTransalte: defaultCoordinates,
    translatedRect: null
  });
  var overNode = getDroppableNode(tracked.current.overId, droppableContainers);
  var windowRect = useClientRect(activeNode ? activeNode.ownerDocument.defaultView : null);
  var containerNodeRect = useClientRect(activeNode ? activeNode.parentElement : null);
  var scrollDetectionCoordinates = activeNodeRect ? add(centerOfRectangle(activeNodeRect, activeNodeRect.left, activeNodeRect.top), translate) : defaultCoordinates;
  var detectedScrollElement = useFindElementFromPoint(scrollDetectionCoordinates, activeNode == null ? void 0 : activeNode.ownerDocument);
  var scrollTarget = active ? overNode != null ? overNode : detectedScrollElement : null;
  var scrollableAncestors = useScrollableAncestors(scrollTarget);
  var scrollableAncestorRects = useClientRects(scrollableAncestors);

  var _useNodeRef = useNodeRef(),
      overlayNodeRef = _useNodeRef[0],
      setOverlayNodeRef = _useNodeRef[1];

  var overlayNodeRect = useClientRect(active ? overlayNodeRef.current : null, willRecomputeLayouts);
  var modifiedTranslate = applyModifiers(modifiers, {
    transform: {
      x: translate.x - nodeRectDelta.x,
      y: translate.y - nodeRectDelta.y,
      scaleX: 1,
      scaleY: 1
    },
    activeNodeRect: activeNodeClientRect,
    draggingNodeRect: overlayNodeRect != null ? overlayNodeRect : activeNodeClientRect,
    containerNodeRect: containerNodeRect,
    overlayNodeRect: overlayNodeRect,
    scrollableAncestors: scrollableAncestors,
    scrollableAncestorRects: scrollableAncestorRects,
    windowRect: windowRect
  });
  var scrolllAdjustment = useScrollOffsets(scrollableAncestors);
  var scrollAdjustedTransalte = add(modifiedTranslate, scrolllAdjustment);
  var translatedRect = activeNodeRect ? getAdjustedRect(activeNodeRect, modifiedTranslate) : null;
  var collisionRect = translatedRect ? getAdjustedRect(translatedRect, scrolllAdjustment) : null;
  var overId = active && collisionRect ? collisionDetection(Array.from(droppableRects.entries()), collisionRect) : null;
  var overNodeRect = getLayoutRect(overId, droppableRects);
  var over = useMemo(function () {
    return overId && overNodeRect ? {
      id: overId,
      rect: overNodeRect
    } : null;
  }, [overId, overNodeRect]);
  var transform = adjustScale(modifiedTranslate, overNodeRect, activeNodeRect);
  var sensorContext = useRef({
    activeNode: activeNode,
    collisionRect: collisionRect,
    droppableRects: droppableRects,
    droppableContainers: droppableContainers,
    over: over,
    scrollableAncestors: scrollableAncestors,
    translatedRect: translatedRect
  });
  var instantiateSensor = useCallback(function (event, _ref2) {
    var Sensor = _ref2.sensor,
        options = _ref2.options;

    if (!activeRef.current) {
      return;
    }

    var activeNode = draggableNodes[activeRef.current];

    if (!activeNode) {
      return;
    }

    var sensorInstance = new Sensor({
      active: activeRef.current,
      activeNode: activeNode,
      event: event.nativeEvent,
      options: options,
      // Sensors need to be instantiated with refs for arguments that change over time
      // otherwise they are frozen in time with the stale arguments
      context: sensorContext,
      onStart: function onStart(initialCoordinates) {
        var id = activeRef.current;

        if (!id) {
          return;
        }

        var onDragStart = latestProps.current.onDragStart;
        dispatch({
          type: Action.DragStart,
          initialCoordinates: initialCoordinates,
          active: id
        });
        onDragStart == null ? void 0 : onDragStart({
          active: {
            id: id
          }
        });
      },
      onMove: function onMove(coordinates) {
        dispatch({
          type: Action.DragMove,
          coordinates: coordinates
        });
      },
      onEnd: createHandler(Action.DragEnd),
      onCancel: createHandler(Action.DragCancel)
    });
    setActiveSensor(sensorInstance);
    setActivatorEvent(event.nativeEvent);

    function createHandler(type) {
      return function handler() {
        var _tracked$current = tracked.current,
            overId = _tracked$current.overId,
            scrollAdjustedTransalte = _tracked$current.scrollAdjustedTransalte;
        var props = latestProps.current;
        var activeId = activeRef.current;

        if (activeId) {
          activeRef.current = null;
        }

        dispatch({
          type: type
        });
        setActiveSensor(null);
        setActivatorEvent(null);
        var handler = type === Action.DragEnd ? props.onDragEnd : props.onDragCancel;

        if (activeId) {
          handler == null ? void 0 : handler({
            active: {
              id: activeId
            },
            delta: scrollAdjustedTransalte,
            over: overId ? {
              id: overId
            } : null
          });
        }
      };
    }
  }, [dispatch, draggableNodes]);
  var bindActivatorToSensorInstantiator = useCallback(function (handler, sensor) {
    return function (event, active) {
      var nativeEvent = event.nativeEvent;

      if ( // No active draggable
      activeRef.current !== null || // Event has already been captured
      nativeEvent.dndKit || nativeEvent.defaultPrevented) {
        return;
      }

      if (handler(event, sensor.options) === true) {
        nativeEvent.dndKit = {
          capturedBy: sensor.sensor
        };
        activeRef.current = active;
        instantiateSensor(event, sensor);
      }
    };
  }, [instantiateSensor]);
  var activators = useCombineActivators(sensors, bindActivatorToSensorInstantiator);
  useIsomorphicLayoutEffect(function () {
    latestProps.current = props;
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  Object.values(props));
  useIsomorphicLayoutEffect(function () {
    if (!active) {
      return;
    } // Recompute rects right after dragging has begun in case they have changed


    recomputeLayouts();
  }, [active, recomputeLayouts]);
  useEffect(function () {
    if (!active) {
      initialActiveNodeRectRef.current = null;
    }

    if (active && activeNodeRect && !initialActiveNodeRectRef.current) {
      initialActiveNodeRectRef.current = activeNodeRect;
    }
  }, [activeNodeRect, active]);
  useEffect(function () {
    var activeId = activeRef.current;

    if (!activeId) {
      return;
    }

    var onDragMove = latestProps.current.onDragMove;
    var _tracked$current2 = tracked.current,
        overId = _tracked$current2.overId,
        droppableRects = _tracked$current2.droppableRects,
        translatedRect = _tracked$current2.translatedRect;

    if (!onDragMove || !translatedRect) {
      return;
    }

    var overNodeRect = getLayoutRect(overId, droppableRects);
    onDragMove({
      active: {
        id: activeId
      },
      draggingRect: translatedRect,
      droppableRects: droppableRects,
      delta: {
        x: scrollAdjustedTransalte.x,
        y: scrollAdjustedTransalte.y
      },
      over: overId && overNodeRect ? {
        id: overId,
        rect: overNodeRect
      } : null
    });
  }, [scrollAdjustedTransalte.x, scrollAdjustedTransalte.y]);
  useEffect(function () {
    if (!activeRef.current) {
      return;
    }

    var _tracked$current3 = tracked.current,
        active = _tracked$current3.active,
        droppableRects = _tracked$current3.droppableRects,
        translatedRect = _tracked$current3.translatedRect;

    if (!active || !translatedRect) {
      return;
    }

    var onDragOver = latestProps.current.onDragOver;
    var overNodeRect = getLayoutRect(overId, droppableRects);
    onDragOver == null ? void 0 : onDragOver({
      active: {
        id: active
      },
      droppableRects: tracked.current.droppableRects,
      draggingRect: translatedRect,
      over: overId && overNodeRect ? {
        id: overId,
        rect: overNodeRect
      } : null
    });
  }, [overId]);
  useEffect(function () {
    tracked.current = {
      active: active,
      droppableRects: droppableRects,
      overId: overId,
      translatedRect: translatedRect,
      scrollAdjustedTransalte: scrollAdjustedTransalte
    };
  }, [active, droppableRects, overId, translatedRect, scrollAdjustedTransalte]);
  useIsomorphicLayoutEffect(function () {
    sensorContext.current = {
      activeNode: activeNode,
      collisionRect: collisionRect,
      droppableRects: droppableRects,
      droppableContainers: droppableContainers,
      over: over,
      scrollableAncestors: scrollableAncestors,
      translatedRect: translatedRect
    };
  }, [activeNode, collisionRect, droppableRects, droppableContainers, over, scrollableAncestors, translatedRect]);
  useAutoScroller({
    draggingRect: translatedRect,
    disabled: !autoScroll || !(activeSensor == null ? void 0 : activeSensor.autoScrollEnabled),
    scrollableAncestors: scrollableAncestors,
    scrollableAncestorRects: scrollableAncestorRects
  });
  var contextValue = useMemo(function () {
    var memoizedContext = {
      active: active,
      activeNode: activeNode,
      activeNodeRect: activeNodeRect,
      activeNodeClientRect: activeNodeClientRect,
      activatorEvent: activatorEvent,
      activators: activators,
      ariaDescribedById: {
        draggable: draggableDescribedById
      },
      overlayNode: {
        nodeRef: overlayNodeRef,
        rect: overlayNodeRect,
        setRef: setOverlayNodeRef
      },
      containerNodeRect: containerNodeRect,
      dispatch: dispatch,
      draggableNodes: draggableNodes,
      droppableContainers: droppableContainers,
      droppableRects: droppableRects,
      over: over,
      recomputeLayouts: recomputeLayouts,
      scrollableAncestors: scrollableAncestors,
      scrollableAncestorRects: scrollableAncestorRects,
      willRecomputeLayouts: willRecomputeLayouts,
      windowRect: windowRect
    };
    return memoizedContext;
  }, [active, activeNode, activeNodeClientRect, activeNodeRect, activatorEvent, activators, containerNodeRect, overlayNodeRect, overlayNodeRef, dispatch, draggableNodes, draggableDescribedById, droppableContainers, droppableRects, over, recomputeLayouts, scrollableAncestors, scrollableAncestorRects, setOverlayNodeRef, willRecomputeLayouts, windowRect]);
  return React.createElement(React.Fragment, null, React.createElement(Context.Provider, {
    value: contextValue
  }, React.createElement(ActiveDraggableContext.Provider, {
    value: transform
  }, children)), React.createElement(Accessibility, {
    announcements: announcements,
    activeId: active,
    overId: overId,
    lastEvent: lastEvent,
    hiddenTextDescribedById: draggableDescribedById,
    screenReaderInstructions: screenReaderInstructions$1
  }));
});

function getDroppableNode(id, droppableContainers) {
  var _droppableContainers$, _droppableContainers$2;

  return id ? (_droppableContainers$ = (_droppableContainers$2 = droppableContainers[id]) == null ? void 0 : _droppableContainers$2.node.current) != null ? _droppableContainers$ : null : null;
}

function getDraggableNode(id, droppableContainers) {
  var _droppableContainers$3;

  return id ? (_droppableContainers$3 = droppableContainers[id]) != null ? _droppableContainers$3 : null : null;
}

function getLayoutRect(id, layoutRectMap) {
  var _layoutRectMap$get;

  return id ? (_layoutRectMap$get = layoutRectMap.get(id)) != null ? _layoutRectMap$get : null : null;
}

var NullContext = /*#__PURE__*/createContext(null);
var defaultRole = 'button';
function useDraggable(_ref) {
  var id = _ref.id,
      _ref$disabled = _ref.disabled,
      disabled = _ref$disabled === void 0 ? false : _ref$disabled,
      attributes = _ref.attributes;

  var _useContext = useContext(Context),
      active = _useContext.active,
      activeNodeRect = _useContext.activeNodeRect,
      activatorEvent = _useContext.activatorEvent,
      ariaDescribedById = _useContext.ariaDescribedById,
      draggableNodes = _useContext.draggableNodes,
      droppableRects = _useContext.droppableRects,
      activators = _useContext.activators,
      over = _useContext.over;

  var _ref2 = attributes != null ? attributes : {},
      _ref2$role = _ref2.role,
      role = _ref2$role === void 0 ? defaultRole : _ref2$role,
      _ref2$roleDescription = _ref2.roleDescription,
      roleDescription = _ref2$roleDescription === void 0 ? 'draggable' : _ref2$roleDescription,
      _ref2$tabIndex = _ref2.tabIndex,
      tabIndex = _ref2$tabIndex === void 0 ? 0 : _ref2$tabIndex;

  var isDragging = Boolean(active === id);
  var transform = useContext(isDragging ? ActiveDraggableContext : NullContext);

  var _useNodeRef = useNodeRef(),
      node = _useNodeRef[0],
      setNodeRef = _useNodeRef[1];

  var listeners = useSyntheticListeners(activators, id);
  useEffect(function () {
    draggableNodes[id] = node;
    return function () {
      delete draggableNodes[id];
    };
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [draggableNodes, id]);
  return {
    active: active,
    activeNodeRect: activeNodeRect,
    activatorEvent: activatorEvent,
    attributes: {
      role: role,
      tabIndex: tabIndex,
      'aria-pressed': isDragging && role === defaultRole ? true : undefined,
      'aria-roledescription': roleDescription,
      'aria-describedby': ariaDescribedById.draggable
    },
    droppableRects: droppableRects,
    isDragging: isDragging,
    listeners: disabled ? undefined : listeners,
    node: node,
    over: over,
    setNodeRef: setNodeRef,
    transform: transform
  };
}

function useDndContext() {
  return useContext(Context);
}

var defaultData = {};
function useDroppable(_ref) {
  var _ref$data = _ref.data,
      data = _ref$data === void 0 ? defaultData : _ref$data,
      _ref$disabled = _ref.disabled,
      disabled = _ref$disabled === void 0 ? false : _ref$disabled,
      id = _ref.id;

  var _useContext = useContext(Context),
      dispatch = _useContext.dispatch,
      over = _useContext.over;

  var rect = useRef(null);

  var _useNodeRef = useNodeRef(),
      nodeRef = _useNodeRef[0],
      setNodeRef = _useNodeRef[1];

  var dataRef = useRef(data);
  useIsomorphicLayoutEffect(function () {
    if (dataRef.current !== data) {
      dataRef.current = data;
    }
  }, [data]);
  useIsomorphicLayoutEffect(function () {
    dispatch({
      type: Action.RegisterDroppable,
      element: {
        id: id,
        disabled: disabled,
        node: nodeRef,
        rect: rect,
        data: dataRef
      }
    });
    return function () {
      return dispatch({
        type: Action.UnregisterDroppable,
        id: id
      });
    };
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [id]);
  useEffect(function () {
    dispatch({
      type: Action.SetDroppableDisabled,
      id: id,
      disabled: disabled
    });
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [disabled]);
  return {
    rect: rect,
    isOver: (over == null ? void 0 : over.id) === id,
    node: nodeRef,
    over: over,
    setNodeRef: setNodeRef
  };
}

function useDerivedTransform(transform, rect, overlayNode) {
  var prevRect = useRef(rect);
  return useLazyMemo(function (previousValue) {
    var initial = prevRect.current;

    if (rect !== initial) {
      if (rect && initial) {
        var layoutHasChanged = initial.left !== rect.left || initial.top !== rect.top;

        if (layoutHasChanged && !previousValue) {
          var overlayNodeRect = overlayNode == null ? void 0 : overlayNode.getBoundingClientRect();

          if (overlayNodeRect) {
            var delta = _extends({}, transform, {
              x: overlayNodeRect.left - rect.left,
              y: overlayNodeRect.top - rect.top
            });

            return delta;
          }
        }
      }

      prevRect.current = rect;
    }

    return undefined;
  }, [rect, transform, overlayNode]);
}

function useDropAnimation(_ref) {
  var animate = _ref.animate,
      adjustScale = _ref.adjustScale,
      activeId = _ref.activeId,
      draggableNodes = _ref.draggableNodes,
      duration = _ref.duration,
      easing = _ref.easing,
      node = _ref.node,
      transform = _ref.transform;

  var _useState = useState(false),
      dropAnimationComplete = _useState[0],
      setDropAnimationComplete = _useState[1];

  useEffect(function () {
    var shouldPerformDropAnimation = transform ? Boolean(Math.abs(transform.x) || Math.abs(transform.y)) : false;

    if (!animate || !activeId || !easing || !duration || !shouldPerformDropAnimation) {
      if (animate) {
        setDropAnimationComplete(true);
      }

      return;
    }

    requestAnimationFrame(function () {
      var _draggableNodes$activ;

      var finalNode = (_draggableNodes$activ = draggableNodes[activeId]) == null ? void 0 : _draggableNodes$activ.current;

      if (transform && node && finalNode && finalNode.parentNode !== null) {
        var fromNode = node.children.length > 1 ? node : node.children[0];

        if (fromNode) {
          var from = fromNode.getBoundingClientRect();
          var to = getViewRect(finalNode);
          var delta = {
            x: from.left - to.left,
            y: from.top - to.top
          };

          if (Math.abs(delta.x) || Math.abs(delta.y)) {
            var scaleDelta = {
              scaleX: adjustScale ? to.width * transform.scaleX / from.width : 1,
              scaleY: adjustScale ? to.height * transform.scaleY / from.height : 1
            };
            var finalTransform = CSS.Transform.toString(_extends({
              x: transform.x - delta.x,
              y: transform.y - delta.y
            }, scaleDelta));
            var originalOpacity = finalNode.style.opacity;
            finalNode.style.opacity = '0';
            node.animate([{
              transform: CSS.Transform.toString(transform)
            }, {
              transform: finalTransform
            }], {
              easing: easing,
              duration: duration
            }).finished.then(function () {
              setDropAnimationComplete(true);

              if (finalNode) {
                finalNode.style.opacity = originalOpacity;
              }
            });
            return;
          }
        }
      }

      setDropAnimationComplete(true);
    });
  }, [animate, activeId, adjustScale, draggableNodes, duration, easing, node, transform]);
  useIsomorphicLayoutEffect(function () {
    if (dropAnimationComplete) {
      setDropAnimationComplete(false);
    }
  }, [dropAnimationComplete]);
  return dropAnimationComplete;
}

var defaultTransition = function defaultTransition(activatorEvent) {
  var isKeyboardActivator = activatorEvent instanceof KeyboardEvent;
  return isKeyboardActivator ? 'transform 250ms ease' : undefined;
};

var defaultDropAnimation = {
  duration: 250,
  easing: 'ease'
};
var DragOverlay = /*#__PURE__*/React.memo(function (_ref) {
  var _attributesSnapshot$c;

  var _ref$adjustScale = _ref.adjustScale,
      adjustScale = _ref$adjustScale === void 0 ? false : _ref$adjustScale,
      children = _ref.children,
      _ref$dropAnimation = _ref.dropAnimation,
      dropAnimation = _ref$dropAnimation === void 0 ? defaultDropAnimation : _ref$dropAnimation,
      _ref$transition = _ref.transition,
      transition = _ref$transition === void 0 ? defaultTransition : _ref$transition,
      modifiers = _ref.modifiers,
      _ref$wrapperElement = _ref.wrapperElement,
      wrapperElement = _ref$wrapperElement === void 0 ? 'div' : _ref$wrapperElement,
      className = _ref.className,
      _ref$zIndex = _ref.zIndex,
      zIndex = _ref$zIndex === void 0 ? 999 : _ref$zIndex;

  var _useDndContext = useDndContext(),
      active = _useDndContext.active,
      activeNodeRect = _useDndContext.activeNodeRect,
      activeNodeClientRect = _useDndContext.activeNodeClientRect,
      containerNodeRect = _useDndContext.containerNodeRect,
      draggableNodes = _useDndContext.draggableNodes,
      activatorEvent = _useDndContext.activatorEvent,
      overlayNode = _useDndContext.overlayNode,
      scrollableAncestors = _useDndContext.scrollableAncestors,
      scrollableAncestorRects = _useDndContext.scrollableAncestorRects,
      windowRect = _useDndContext.windowRect;

  var transform = useContext(ActiveDraggableContext);
  var modifiedTransform = applyModifiers(modifiers, {
    transform: transform,
    activeNodeRect: activeNodeClientRect,
    overlayNodeRect: overlayNode.rect,
    draggingNodeRect: overlayNode.rect,
    containerNodeRect: containerNodeRect,
    scrollableAncestors: scrollableAncestors,
    scrollableAncestorRects: scrollableAncestorRects,
    windowRect: windowRect
  });
  var derivedTransform = useDerivedTransform(modifiedTransform, activeNodeRect, overlayNode.nodeRef.current);
  var isDragging = active !== null;
  var intermediateTransform = derivedTransform != null ? derivedTransform : modifiedTransform;
  var finalTransform = adjustScale ? intermediateTransform : _extends({}, intermediateTransform, {
    scaleX: 1,
    scaleY: 1
  });
  var style = activeNodeRect ? {
    position: 'fixed',
    width: activeNodeRect.width,
    height: activeNodeRect.height,
    top: activeNodeRect.top,
    left: activeNodeRect.left,
    zIndex: zIndex,
    transform: CSS.Transform.toString(finalTransform),
    touchAction: 'none',
    pointerEvents: 'none',
    transformOrigin: adjustScale && activatorEvent ? getRelativeTransformOrigin(activatorEvent, activeNodeRect) : undefined,
    transition: derivedTransform ? undefined : typeof transition === 'function' ? transition(activatorEvent) : transition
  } : undefined;
  var attributes = isDragging ? {
    style: style,
    children: children,
    className: className,
    transform: finalTransform
  } : undefined;
  var attributesSnapshot = useRef(attributes);
  var derivedAttributes = attributes != null ? attributes : attributesSnapshot.current;

  var _ref2 = derivedAttributes != null ? derivedAttributes : {},
      finalChildren = _ref2.children,
      otherAttributes = _objectWithoutPropertiesLoose(_ref2, ["children", "transform"]);

  var prevActive = useRef(active);
  var dropAnimationComplete = useDropAnimation({
    animate: Boolean(dropAnimation && prevActive.current && !active),
    adjustScale: adjustScale,
    activeId: prevActive.current,
    draggableNodes: draggableNodes,
    duration: dropAnimation == null ? void 0 : dropAnimation.duration,
    easing: dropAnimation == null ? void 0 : dropAnimation.easing,
    node: overlayNode.nodeRef.current,
    transform: (_attributesSnapshot$c = attributesSnapshot.current) == null ? void 0 : _attributesSnapshot$c.transform
  });
  var shouldRender = Boolean(finalChildren && (children || dropAnimation && !dropAnimationComplete));
  useEffect(function () {
    if (prevActive.current !== active) {
      prevActive.current = active;
    }

    if (active && attributesSnapshot.current !== attributes) {
      attributesSnapshot.current = attributes;
    }
  }, [active, attributes]);
  useEffect(function () {
    if (dropAnimationComplete) {
      attributesSnapshot.current = undefined;
    }
  }, [dropAnimationComplete]);

  if (!shouldRender) {
    return null;
  }

  return React.createElement(wrapperElement, _extends({}, otherAttributes, {
    ref: overlayNode.setRef
  }), finalChildren);
});

export { DndContext, DragOverlay, KeyboardCode, KeyboardSensor, MouseSensor, PointerSensor, TouchSensor, applyModifiers, closestCenter, closestCorners, defaultAnnouncements, defaultCoordinates, getBoundingClientRect, getViewRect, rectIntersection, useDndContext, useDraggable, useDroppable, useSensor, useSensors };
//# sourceMappingURL=core.esm.js.map
