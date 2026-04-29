import { motion } from 'framer-motion';

export default function DevTools() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Developer Tools</h1>
      <p className="text-text-secondary">Clean up dev-specific junk: node_modules, Xcode, Docker, and more.</p>
      <div className="glass rounded-2xl p-12 flex items-center justify-center">
        <p className="text-text-muted">Developer junk scanner coming soon</p>
      </div>
    </motion.div>
  );
}
