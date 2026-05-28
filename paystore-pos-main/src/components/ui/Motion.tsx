import { motion } from "framer-motion";
import React from "react";

export const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: 6, transition: { duration: 0.16, ease: "easeIn" } },
};

export const MotionDiv: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...rest }) => (
  <motion.div initial="initial" animate="animate" exit="exit" variants={fadeIn} {...rest}>
    {children}
  </motion.div>
);

export default MotionDiv;
