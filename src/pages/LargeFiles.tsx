import { motion } from 'framer-motion';

export default function LargeFiles() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Large Files</h1>
      <p className="text-text-secondary">Find files larger than 100MB.</p>
      <div className="glass rounded-2xl p-12 flex items-center justify-center">
        <p className="text-text-muted">Large files finder coming soon</p>
      </div>
    </motion.div>
  );
}
