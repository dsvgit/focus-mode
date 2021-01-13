import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  Fragment
} from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useSpring, animated } from "react-spring";
import shortid from "shortid";
import "./styles.css";
import useEventListener from "./useEventListener";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AppOpacityContext = createContext();

function useFocusWrapper({ height }) {
  const [id] = useState(shortid.generate());
  const offsetY = -height;
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState(false);

  const { setAppOpacity, setSelectedControl } = useContext(AppOpacityContext);

  const intervalRef = useRef(null);

  function setFocusedInterval() {
    setFocused(true);
    intervalRef.current = setInterval(() => setFocused(true), 500);
  }

  function clearFocusedInterval() {
    setFocused(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const referenceRef = useRef(null);
  const popperRef = useRef(null);

  const { styles, attributes } = usePopper(
    referenceRef.current,
    popperRef.current,
    {
      placement: "top",
      strategy: "fixed",
      modifiers: [
        {
          name: "offset",
          enabled: true,
          options: {
            offset: [0, offsetY]
          }
        }
      ]
    }
  );

  useEventListener(document, "mousemove", () => {
    setFocused(false);
  });

  useEffect(() => {
    setAppOpacity(focused ? 0 : 1);
  }, [focused, setAppOpacity]);

  useEffect(() => {
    if (focused) {
      setSelectedControl(id);
    }
  }, [id, focused, setSelectedControl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    id,
    mounted,
    setFocusedInterval,
    clearFocusedInterval,
    height,
    popperRef,
    referenceRef,
    styles,
    attributes
  };
}

function FocusModeWrapper({
  id,
  mounted,
  height,
  popperRef,
  referenceRef,
  styles,
  attributes,
  children
}) {
  const { selectedControl, appOpacity: _appOpacity } = useContext(
    AppOpacityContext
  );
  const appOpacity = selectedControl === id ? 1 : _appOpacity;

  const style = useSpring({
    to: async (next, cancel) => {
      appOpacity !== 1 && (await delay(1000));
      await next({ opacity: appOpacity, config: { duration: 500 } });
    },
    from: { opacity: appOpacity }
  });

  return (
    <Fragment>
      {createPortal(
        <animated.div
          ref={popperRef}
          style={{
            ...style,
            ...styles.popper,
            display: mounted ? "block" : "none",
            zIndex: 100
          }}
          {...attributes.popper}
        >
          {children}
        </animated.div>,
        document.querySelector("#app-opacity-portal")
      )}

      <div
        className="placeholder"
        style={{
          width: "100%",
          height: height
        }}
        ref={referenceRef}
      />
    </Fragment>
  );
}

function FocusModeProvider({ children }) {
  const [selectedControl, setSelectedControl] = useState(null);
  const [appOpacity, setAppOpacity] = useState(1);

  const style = useSpring({
    to: async (next, cancel) => {
      appOpacity !== 1 && (await delay(1000));
      await next({ opacity: appOpacity, config: { duration: 500 } });
    },
    from: { opacity: appOpacity }
  });

  useEffect(() => {
    setAppOpacity(1);
  }, []);

  return (
    <AppOpacityContext.Provider
      value={{
        appOpacity,
        setAppOpacity,
        selectedControl,
        setSelectedControl,
        style
      }}
    >
      <animated.div style={style}>{children}</animated.div>
    </AppOpacityContext.Provider>
  );
}

function Page() {
  const focusWrapperProps1 = useFocusWrapper({ height: 105 });
  const focusWrapperProps2 = useFocusWrapper({ height: 32 });

  return (
    <div>
      <h1>This is the focus mode text area.</h1>
      <FocusModeWrapper {...focusWrapperProps1}>
        <textarea
          placeholder="Click here to start writing..."
          rows={3}
          onFocus={() => focusWrapperProps1.setFocusedInterval()}
          onBlur={() => focusWrapperProps1.clearFocusedInterval()}
        />
      </FocusModeWrapper>

      <h1>This is the focus mode input.</h1>
      <FocusModeWrapper {...focusWrapperProps2}>
        <input
          placeholder="or here..."
          onFocus={() => focusWrapperProps2.setFocusedInterval()}
          onBlur={() => focusWrapperProps2.clearFocusedInterval()}
        />
      </FocusModeWrapper>
    </div>
  );
}

export default function App() {
  return (
    <div className="App">
      <FocusModeProvider>
        <Page />
      </FocusModeProvider>
    </div>
  );
}
