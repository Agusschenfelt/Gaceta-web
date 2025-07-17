import { motion } from 'framer-motion'

const revealImage = {
  hidden:  { opacity: 0, scale: 1.05 },
  visible: { opacity: 1, scale: 1.0 }
}

export function TextDiv({ children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -50 }}         
      whileInView={{ opacity: 1, x: 0 }}   
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}


export function MediaSectionShows({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={revealImage}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.03}}
    >
      {children}
    </motion.div>
  )
}

export function MediaSection({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={revealImage}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut'}}
    >
      {children}
    </motion.div>
  )
}