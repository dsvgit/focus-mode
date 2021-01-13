import { useEffect } from "react";

function useEventListener(element, eventName, fn, dependencies) {
  useEffect(() => {
    element.addEventListener(eventName, fn);

    return () => element.removeEventListener(eventName, fn);
  }, [element, dependencies]);
}

export default useEventListener;
