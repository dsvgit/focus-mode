import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  Fragment
} from "react";
import { usePopper } from "react-popper";
import { useSpring, animated } from "react-spring";
import shortid from "shortid";
import arrayMove from "array-move";
import {
  sortableContainer,
  sortableElement,
  sortableHandle
} from "react-sortable-hoc";
import useEventListener from "./useEventListener";
import "./styles.css";

const DragHandle = sortableHandle(() => <div className="handle">::</div>);

const SortableItem = sortableElement(({ children }) => <div>{children}</div>);

const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AppOpacityContext = createContext();

function useFocusWrapper({ height }) {
  const [id] = useState(shortid.generate());
  const offsetY = -height;
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState(false);

  const { setFocusModeEnabled, setSelectedControl } = useContext(
    AppOpacityContext
  );

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

  const popper = usePopper(referenceRef.current, popperRef.current, {
    placement: "top",
    strategy: "absolute",
    modifiers: [
      {
        name: "offset",
        enabled: true,
        options: {
          offset: [0, offsetY]
        }
      }
    ]
  });
  const { styles, attributes, update } = popper;

  useEventListener(document, "mousemove", () => {
    setFocused(false);
  });

  useEffect(() => {
    setFocusModeEnabled(focused);
  }, [focused, setFocusModeEnabled]);

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
    attributes,
    update
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
  const { selectedControl, focusModeActive } = useContext(AppOpacityContext);
  const popperActive = focusModeActive && selectedControl === id;

  return (
    <Fragment>
      <div
        className="placeholder"
        style={{
          width: "100%",
          height: popperActive ? height : "auto"
        }}
        ref={referenceRef}
      >
        <animated.div
          ref={popperRef}
          style={{
            ...(popperActive ? styles.popper : {}),
            width: "100%",
            display: mounted ? "block" : "none",
            zIndex: 101
          }}
          {...attributes.popper}
        >
          {children}
        </animated.div>
      </div>
    </Fragment>
  );
}

function FocusModeProvider({ children }) {
  const [selectedControl, setSelectedControl] = useState(null);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const opacity = focusModeEnabled ? 1 : 0;

  const style = useSpring({
    to: async (next, cancel) => {
      focusModeEnabled && setFocusModeActive(true);
      focusModeEnabled && (await delay(1000));
      await next({ opacity, config: { duration: 500 } });
      !focusModeEnabled && setFocusModeActive(false);
    },
    from: { opacity }
  });

  return (
    <AppOpacityContext.Provider
      value={{
        focusModeActive,
        focusModeEnabled,
        setFocusModeEnabled,
        selectedControl,
        setSelectedControl,
        style
      }}
    >
      <animated.div
        style={{ ...style, display: focusModeActive ? "block" : "none" }}
        className="overlay"
      />
      <div>{children}</div>
    </AppOpacityContext.Provider>
  );
}

function Component({ children }) {
  return (
    <div className="componentContainer">
      <DragHandle />
      <div className="component">{children}</div>
    </div>
  );
}

function Page() {
  const focusWrapperProps1 = useFocusWrapper({ height: 95 });
  const focusWrapperProps2 = useFocusWrapper({ height: 30 });

  const elements = [
    <Component>
      <h1>This is the focus mode text area.</h1>
    </Component>,
    <Component>
      <FocusModeWrapper {...focusWrapperProps1}>
        <textarea
          placeholder="Click here to start writing..."
          rows={3}
          onFocus={() => focusWrapperProps1.setFocusedInterval()}
          onBlur={() => focusWrapperProps1.clearFocusedInterval()}
        />
      </FocusModeWrapper>
    </Component>,
    <Component>
      <h1>This is the focus mode input.</h1>
    </Component>,
    <Component>
      <FocusModeWrapper {...focusWrapperProps2}>
        <input
          placeholder="or here..."
          onFocus={() => focusWrapperProps2.setFocusedInterval()}
          onBlur={() => focusWrapperProps2.clearFocusedInterval()}
        />
      </FocusModeWrapper>
    </Component>
  ];

  const [order, setOrder] = useState(elements.map((_, index) => index));

  function onSortEnd({ oldIndex, newIndex }) {
    setOrder((items) => arrayMove(items, oldIndex, newIndex));
  }

  return (
    <div>
      <SortableContainer
        helperClass="helperClass"
        onSortEnd={onSortEnd}
        useDragHandle={true}
      >
        {order.map((id, index) => (
          <SortableItem key={id} index={index}>
            {elements[id]}
          </SortableItem>
        ))}
      </SortableContainer>
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
