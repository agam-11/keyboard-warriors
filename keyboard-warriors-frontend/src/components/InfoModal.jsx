import { motion, AnimatePresence } from "framer-motion";

export default function InfoModal({ isOpen, onClose, content }) {
  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-3xl w-full"
          >
            {content.type === "text" && (
              <pre className="text-left text-sm whitespace-pre-wrap font-mono bg-muted/20 p-4 rounded">
                {content.content}
              </pre>
            )}
            {content.type === "image" && (
              <img
                src={content.content}
                alt="Challenge Hint"
                className="max-w-full max-h-[80vh] mx-auto rounded"
              />
            )}
            <button
              onClick={onClose}
              className="mt-6 w-full bg-primary text-background font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors duration-300"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
