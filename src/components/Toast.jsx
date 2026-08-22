import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = () => {
  const { toastMsg } = useContext(AppContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toastMsg) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'var(--card)',
            border: `1px solid ${toastMsg.type === 'error' ? 'var(--pink)' : toastMsg.type === 'warn' ? 'var(--gold)' : 'var(--green)'}`,
            color: toastMsg.type === 'error' ? 'var(--pink)' : toastMsg.type === 'warn' ? 'var(--gold)' : 'var(--green)',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {toastMsg.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
