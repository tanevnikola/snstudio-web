/** Shared drag state for composer components. */
let _dragHeight = 0;

export function setDragHeight(h) {
  _dragHeight = h;
}

export function getDragHeight() {
  return _dragHeight;
}
