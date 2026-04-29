import { motion } from 'framer-motion';

export default function Visualizer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Visualizer</h1>
      <p className="text-text-secondary">Interactive treemap visualization.</p>
      <div className="glass rounded-2xl p-12 flex items-center justify-center">
        <p className="text-text-muted">Treemap will render here after scanning</p>
      </div>
    </motion.div>
  );
}
