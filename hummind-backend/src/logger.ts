import pino from 'pino';
import fs from 'fs';
import path from 'path';

// 📂 Chemin du fichier de logs
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFilePath = path.join(logDir, 'app.log');

// 🚀 Création du logger
export const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  // Flux : console + fichier
  pino.multistream([
    { stream: process.stdout }, // affichage console
    { stream: fs.createWriteStream(logFilePath, { flags: 'a' }) }, // fichier
  ]),
);

logger.info(
  `Logger initialisé. Les logs seront enregistrés dans ${logFilePath}`,
);
