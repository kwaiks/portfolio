import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "node:util";
import { ReadableStream as NodeReadableStream } from "node:stream/web";

// jsdom lacks crypto.randomUUID (assistant widget), TextEncoder/TextDecoder
// (stream parsing), and the global ReadableStream (streaming fetch mocks).
// Polyfill all of them so tests run in the jsdom environment.
if (typeof globalThis.crypto?.randomUUID !== "function") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      ...globalThis.crypto,
      randomUUID: () => "00000000-0000-4000-8000-000000000000",
    },
    configurable: true,
  });
}

if (typeof globalThis.TextEncoder === "undefined") {
  (globalThis as { TextEncoder: unknown }).TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  (globalThis as { TextDecoder: unknown }).TextDecoder = TextDecoder;
}
if (typeof globalThis.ReadableStream === "undefined") {
  (globalThis as { ReadableStream: unknown }).ReadableStream = NodeReadableStream;
}

// jsdom doesn't implement scroll APIs; stub them so effects that call
// scrollTo/scrollIntoView (the assistant widget) don't throw.
if (typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = () => {};
}
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom has no IntersectionObserver; stub it so the Nav scroll-spy effect works.
if (typeof (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver === "undefined") {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (globalThis as { IntersectionObserver: unknown }).IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
