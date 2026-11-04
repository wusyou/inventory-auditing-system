import { createContext, useState, useCallback, useRef } from "react";

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((message) => {
    setState({ message });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function handleConfirm() {
    if (resolver.current) resolver.current(true);
    setState(null);
  }

  function handleCancel() {
    if (resolver.current) resolver.current(false);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-message">{state.message}</p>
            <div className="modal-actions">
              <button onClick={handleCancel}>Cancel</button>
              <button className="btn-danger" onClick={handleConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmContext;
