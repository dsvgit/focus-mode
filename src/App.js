import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  Fragment
} from "react";
import TextareaAutosize from "react-textarea-autosize";
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

function useFocusWrapper() {
  const [id] = useState(shortid.generate());
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
    strategy: "absolute"
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
  popperRef,
  referenceRef,
  styles,
  attributes,
  children
}) {
  const { selectedControl, focusModeActive, focusModeSet } = useContext(
    AppOpacityContext
  );
  const popperActive = focusModeActive && selectedControl === id;

  const style = useSpring({
    to: async (next, cancel) => {
      focusModeSet && selectedControl === id && (await delay(1000));
      await next({
        transform:
          focusModeSet && selectedControl === id ? `scale(1.05)` : `scale(1)`
      });
    },
    from: { transform: `scale(1)` }
  });

  return (
    <Fragment>
      <div
        className="placeholder"
        style={{
          width: "100%",
          height: popperActive ? popperRef?.current?.offsetHeight : "auto"
        }}
        ref={referenceRef}
      >
        <animated.div
          ref={popperRef}
          style={{
            ...(popperActive ? styles.popper : {}),
            width: "100%",
            display: mounted ? "block" : "none",
            zIndex: 101,
            ...style
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
  const [focusModeSet, setFocusModeSet] = useState(false);
  const opacity = focusModeEnabled ? 1 : 0;

  const style = useSpring({
    to: async (next, cancel) => {
      !focusModeEnabled && setFocusModeSet(false);

      focusModeEnabled && (await delay(1000));
      focusModeEnabled && setFocusModeActive(true);
      await next({ opacity, config: { duration: 500 } });
      focusModeEnabled && setFocusModeSet(true);
      !focusModeEnabled && setFocusModeActive(false);
    },
    from: { opacity }
  });

  return (
    <AppOpacityContext.Provider
      value={{
        focusModeActive,
        focusModeEnabled,
        focusModeSet,
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
  const focusWrapperProps1 = useFocusWrapper();
  const focusWrapperProps2 = useFocusWrapper();

  const elements = [
    <Component>
      <h1>One morning</h1>
    </Component>,
    <Component>
      <FocusModeWrapper {...focusWrapperProps1}>
        <TextareaAutosize
          defaultValue={`One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. "What's happened to me? " he thought. It wasn't a dream.`}
          placeholder="Click here to start writing..."
          rows={3}
          onFocus={() => focusWrapperProps1.setFocusedInterval()}
          onBlur={() => focusWrapperProps1.clearFocusedInterval()}
        />
      </FocusModeWrapper>
    </Component>,
    <Component>
      <h1>His room</h1>
    </Component>,
    <Component>
      <p>
        His room, a proper human room although a little too small, lay
        peacefully between its four familiar walls. A collection of textile
        samples lay spread out on the table - Samsa was a travelling salesman -
        and above it there hung a picture that he had recently cut out of an
        illustrated magazine and housed in a nice, gilded frame. It showed a
        lady fitted out with a fur hat and fur boa who sat upright, raising a
        heavy fur muff that covered the whole of her lower arm towards the
        viewer. Gregor then turned to look out the window at the dull weather.
      </p>
    </Component>,
    <Component>
      <FocusModeWrapper {...focusWrapperProps2}>
        <input
          defaultValue="His room, a proper human room although a little too small, lay peacefully between its four familiar walls."
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
