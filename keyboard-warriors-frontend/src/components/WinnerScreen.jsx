// Path: frontend/src/components/WinnerScreen.jsx

import { motion } from "framer-motion";

const WinnerScreen = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-4"
    >
      <motion.h1
        variants={itemVariants}
        className="text-6xl md:text-8xl font-bold text-accent tracking-widest"
      >
        ACCESS GRANTED
      </motion.h1>
      <motion.p variants={itemVariants} className="mt-4 text-2xl text-primary">
        MAINFRAME UNLOCKED
      </motion.p>
      <motion.div
        variants={itemVariants}
        className="mt-8 text-4xl font-bold text-foreground bg-accent/20 px-6 py-3 rounded-lg"
      >
        WINNER
      </motion.div>
    </motion.div>
  );
};

export default WinnerScreen;
