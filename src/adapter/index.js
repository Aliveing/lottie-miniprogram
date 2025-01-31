import Taro from '@tarojs/taro';
import XHR from './XMLHttpRequest'

function noop() { }

function createImg(canvas) {
  if (typeof canvas.createImage === 'undefined') {
    // TODO the return value should be replaced after setupLottie
    return {}
  }
  const img = canvas.createImage()
  img.addEventListener = img.addEventListener || function (evtName, callback) {
    if (evtName === 'load') {
      img.onload = function () {
        setTimeout(callback, 0)
      }
    } else if (evtName === 'error') {
      img.onerror = callback
    }
  }
  return img
}

function createElement(tagName) {
  if (tagName === 'canvas') {
    return {
      getContext: function () {
        return {
          fillRect: noop,
        }
      },
    }
  } else if (tagName === 'img') {
    return createImg(this)
  }
}

function wrapSetLineDash(ctx, originalSetLineDash) {
  return function setLineDash(segments) {
    return originalSetLineDash.call(ctx, Array.from(segments))
  }
}

function wrapFill(ctx, originalFill) {
  return function fill() {
    // ignore parameters which causes iOS wechat 7.0.5 crash.
    return originalFill.call(ctx)
  }
}

function wrapMethodFatory(ctx, methodName, wrappedMethod) {
  const originalMethod = ctx[methodName]
  Object.defineProperty(ctx, methodName, {
    get() {
      return wrappedMethod(ctx, originalMethod)
    },
    configurable: true,
    enumerable: true,
  })
}

const systemInfo = Taro.getSystemInfoSync()
const g = {}

g.window = {
  devicePixelRatio: systemInfo.pixelRatio
}
g.document = g.window.document = {
  body: {},
  createElement,
}
g.navigator = g.window.navigator = {
  userAgent: ''
}

XMLHttpRequest = XHR

export const setup = (canvas) => {
  const { window, document } = g
  window.requestAnimationFrame = canvas.requestAnimationFrame.bind(canvas)
  window.cancelAnimationFrame = canvas.cancelAnimationFrame.bind(canvas)

  document.createElement = createElement.bind(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx.canvas) {
    ctx.canvas = canvas
  }

  wrapMethodFatory(ctx, 'setLineDash', wrapSetLineDash)
  wrapMethodFatory(ctx, 'fill', wrapFill)
}

export { g }
