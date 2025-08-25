// Path: frontend/src/components/VaultModal.jsx

import { motion, AnimatePresence } from "framer-motion";

const VaultIcon = () => (
  <svg
    className="w-24 h-24 text-primary"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    />
    <motion.circle
      cx="12"
      cy="12"
      r="6"
      stroke="currentColor"
      strokeWidth="1.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
    />
    <motion.path
      d="M12 8V12L14 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={{ scale: 0, opacity: 0, rotate: -90 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    />
    <motion.path
      d="M12 12L10 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={{ scale: 0, opacity: 0, rotate: -90 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
    />
  </svg>
);

export default function VaultModal({ isOpen, onClose, secretWord }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            className="bg-background border border-primary shadow-lg shadow-primary/20 rounded-lg p-8 text-center flex flex-col items-center"
          >
            <motion.h2
              className="text-2xl font-bold text-primary mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              VAULT UNLOCKED
            </motion.h2>

            <VaultIcon />

            <motion.p
              className="text-lg text-foreground mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Secret word revealed:
            </motion.p>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 2,
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
              className="mt-2 text-4xl font-bold text-accent bg-black px-4 py-2 rounded-md tracking-widest"
            >
              {secretWord}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              onClick={onClose}
              className="mt-8 bg-primary text-background font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors duration-300"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
