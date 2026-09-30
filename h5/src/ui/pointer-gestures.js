import { gameState } from '../state.js';

const TAP_SLOP = 10;
const LONG_PRESS_MS = 650;
const COMPATIBILITY_CLICK_MS = 1000;
const contacts = new Set();
const clickDecisions = new WeakMap();
let pending = null;
let released = null;
let bound = false;
let lastTouchAt = 0;

function actionElement(target) {
  return target?.closest?.('#cv, button, .menu-item, input[type="range"]') || null;
}

function sameContext(gesture) {
  return (
    gesture.sessionId === gameState.sessionId &&
    gesture.dialog === gameState.activeDialog &&
    gesture.exited === gameState.isExited
  );
}

function invalidatePointerGesture() {
  if (pending) pending.cancelled = true;
  if (released) released.cancelled = true;
}

function isTouchClick(event) {
  if (
    event.pointerType === 'touch' ||
    event.pointerType === 'pen' ||
    event.sourceCapabilities?.firesTouchEvents
  )
    return true;
  return (
    !event.pointerType && event.detail > 0 && Date.now() - lastTouchAt < COMPATIBILITY_CLICK_MS
  );
}

function acceptClick(event) {
  if (clickDecisions.has(event)) return clickDecisions.get(event);
  let accepted = !event.defaultPrevented && !(gameState.isGameOver && gameState.isAnimating);
  if (actionElement(event.target) && isTouchClick(event)) {
    accepted =
      accepted &&
      !!released &&
      !released.cancelled &&
      !released.consumed &&
      Date.now() - released.at <= COMPATIBILITY_CLICK_MS &&
      !contacts.size &&
      sameContext(released) &&
      actionElement(event.target) === released.origin &&
      (!event.pointerId || event.pointerId < 0 || event.pointerId === released.id);
    if (released) released.consumed = true;
  }
  clickDecisions.set(event, accepted);
  return accepted;
}

function touchStartPoint() {
  return released ? { clientX: released.x, clientY: released.y } : null;
}

function acceptRangeEvent(event) {
  const gesture = pending || released;
  if (!gesture) return !contacts.size;
  if (
    gesture.cancelled ||
    !sameContext(gesture) ||
    contacts.size > 1 ||
    gesture.origin !== event.target ||
    gesture.rangeCommitted
  )
    return false;
  if (event.type === 'change') {
    if (contacts.size) return false;
    gesture.rangeCommitted = true;
  }
  return true;
}

function bindPointerGestures() {
  if (bound) return;
  bound = true;
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        if (contacts.size) invalidatePointerGesture();
        released = null;
        if (!contacts.size) pending = null;
        lastTouchAt = 0;
        return;
      }
      lastTouchAt = Date.now();
      contacts.add(event.pointerId);
      released = null;
      if (contacts.size > 1) {
        invalidatePointerGesture();
        return;
      }
      const origin = actionElement(event.target);
      pending = {
        id: event.pointerId,
        origin,
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
        sessionId: gameState.sessionId,
        dialog: gameState.activeDialog,
        exited: gameState.isExited,
        cancelled:
          event.isPrimary === false ||
          event.button !== 0 ||
          !origin ||
          (origin.id === 'cv' &&
            (gameState.isAnimating || gameState.activeDialog || gameState.isExited)),
      };
    },
    true,
  );
  document.addEventListener(
    'pointermove',
    (event) => {
      if (
        !pending ||
        pending.id !== event.pointerId ||
        pending.origin?.matches('input[type="range"]')
      )
        return;
      if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > TAP_SLOP)
        pending.cancelled = true;
    },
    true,
  );
  document.addEventListener(
    'pointerup',
    (event) => {
      if (!contacts.has(event.pointerId)) return;
      lastTouchAt = Date.now();
      if (pending?.id === event.pointerId) {
        const isRange = pending.origin?.matches('input[type="range"]');
        const endTarget = document.elementFromPoint
          ? document.elementFromPoint(event.clientX, event.clientY)
          : event.target;
        released = {
          ...pending,
          at: Date.now(),
          consumed: false,
          cancelled:
            pending.cancelled ||
            contacts.size > 1 ||
            !sameContext(pending) ||
            (!isRange &&
              (event.timeStamp - pending.time >= LONG_PRESS_MS ||
                Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > TAP_SLOP ||
                actionElement(endTarget) !== pending.origin)),
        };
        pending = null;
      }
      contacts.delete(event.pointerId);
    },
    true,
  );
  document.addEventListener(
    'pointercancel',
    (event) => {
      if (!contacts.has(event.pointerId)) return;
      lastTouchAt = Date.now();
      contacts.delete(event.pointerId);
      invalidatePointerGesture();
    },
    true,
  );
  document.addEventListener(
    'lostpointercapture',
    (event) => {
      // Normal release also loses capture; only an unfinished contact is a cancellation.
      if (contacts.has(event.pointerId)) invalidatePointerGesture();
    },
    true,
  );
  for (const name of ['contextmenu', 'dragstart'])
    document.addEventListener(
      name,
      (event) => {
        if (!event.target.closest?.('#cv, button')) return;
        invalidatePointerGesture();
        event.preventDefault();
      },
      true,
    );
  // Suppress cancelled touch clicks before native onclick and delegated handlers run.
  document.addEventListener(
    'click',
    (event) => {
      if (acceptClick(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  document.addEventListener(
    'keydown',
    () => {
      invalidatePointerGesture();
      if (!contacts.size) {
        pending = null;
        released = null;
      }
    },
    true,
  );
  const leavePage = () => {
    invalidatePointerGesture();
    contacts.clear();
  };
  window.addEventListener('blur', leavePage);
  window.addEventListener('pagehide', leavePage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) leavePage();
  });
  window.addEventListener('resize', invalidatePointerGesture);
  window.visualViewport?.addEventListener('resize', invalidatePointerGesture);
  window.visualViewport?.addEventListener('scroll', invalidatePointerGesture);
}

export {
  bindPointerGestures,
  invalidatePointerGesture,
  isTouchClick,
  acceptClick,
  acceptRangeEvent,
  touchStartPoint,
};
