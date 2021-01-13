import { useRef, useState } from "react";
import { createPopper } from "@popperjs/core";

import useOnClickOutside from "./useOnClickOutside";

function usePopper(options = {}) {
  const { offset = [0, 10], modifiers = [] } = options;

  const tooltipRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const instanceRef = useRef(null);

  function create(target) {
    instanceRef.current = createPopper(target, tooltipRef.current, {
      modifiers: [
        {
          name: "offset",
          options: {
            offset
          }
        },
        ...modifiers
      ]
    });
  }

  function destroy() {
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }
  }

  function open(target) {
    setIsOpen(true);
    tooltipRef.current.setAttribute("data-show", "");
    create(target);
  }

  function close() {
    setIsOpen(false);
    tooltipRef.current.removeAttribute("data-show");
    destroy();
  }

  useOnClickOutside(tooltipRef, () => {
    close();
  });

  return {
    ref: tooltipRef,
    isOpen,
    open,
    close
  };
}

export default usePopper;
