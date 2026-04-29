import { motion } from 'framer-motion';

export default function Scanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Scanner</h1>
      <p className="text-text-secondary">Full scan results will appear here.</p>
      <div className="glass rounded-2xl p-12 flex items-center justify-center">
        <p className="text-text-muted">Run a scan from the Dashboard to see results</p>
      </div>
    </motion.div>
  );
}
