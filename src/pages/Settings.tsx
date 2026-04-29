import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      <p className="text-text-secondary">App preferences and system info.</p>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Version</span>
          <span className="text-sm text-text-primary">0.1.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Framework</span>
          <span className="text-sm text-text-primary">Tauri v2</span>
        </div>
      </div>
    </motion.div>
  );
}
