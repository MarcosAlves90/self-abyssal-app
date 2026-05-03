import { useEffect, useRef } from "react";

export function createRequestManager() {
  const controllers = new Map();

  function start(scope) {
    const previous = controllers.get(scope);
    if (previous) {
      previous.abort();
    }

    const controller = new AbortController();
    controllers.set(scope, controller);
    return controller;
  }

  function finish(scope, controller) {
    if (controllers.get(scope) === controller) {
      controllers.delete(scope);
    }
  }

  function abort(scope) {
    const controller = controllers.get(scope);
    if (!controller) {
      return;
    }

    controller.abort();
    controllers.delete(scope);
  }

  function abortAll() {
    for (const controller of controllers.values()) {
      controller.abort();
    }
    controllers.clear();
  }

  return {
    abort,
    abortAll,
    finish,
    start,
  };
}

export function useRequestManager() {
  const managerRef = useRef(null);

  if (!managerRef.current) {
    managerRef.current = createRequestManager();
  }

  useEffect(() => {
    return () => {
      managerRef.current?.abortAll();
    };
  }, []);

  return managerRef.current;
}
