import { useEffect } from "react";

export default function useEventListener(ref, event, listener, options) {
  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const listenerWrapper = (e) => listener(e);
    node.addEventListener(event, listenerWrapper, options);

    return () => node.removeEventListener(event, listenerWrapper);
  }, [ref, event, listener, options]);
}
