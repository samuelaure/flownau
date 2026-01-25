import { JSONFilePreset } from 'lowdb/node';
import { config } from './config';

interface ProjectConfig {
  shortCode: string;
  videoCounter: number;
  audioCounter: number;
}

interface AssetEntry {
  type: 'VID' | 'AUD';
  system_filename: string;
  original_filename: string;
  hash: string;
  r2_key: string;
  size: number;
  counter: number;
  uploaded_at: string;
  deleted_at?: string;
  status: string;
}

interface ManifestData {
  projects: Record<string, AssetEntry[]>;
  projectConfig: Record<string, ProjectConfig>;
}

const defaultData: ManifestData = { projects: {}, projectConfig: {} };

export async function getManifest() {
  const db = await JSONFilePreset<ManifestData>(config.manifestFile, defaultData);
  return db;
}

export async function getProjectConfig(db: { data: ManifestData }, projectName: string) {
  return db.data.projectConfig[projectName] || null;
}

export async function setProjectConfig(
  db: { data: ManifestData; write: () => Promise<void> },
  projectName: string,
  configData: any
) {
  db.data.projectConfig[projectName] = {
    shortCode: configData.shortCode.toUpperCase(),
    videoCounter: configData.videoCounter || 0,
    audioCounter: configData.audioCounter || 0,
  };
  await db.write();
}

/**
 * Adds an asset and increments the appropriate counter
 */
export async function addAsset(
  db: { data: ManifestData; write: () => Promise<void> },
  projectName: string,
  type: 'VID' | 'AUD',
  assetData: any
) {
  if (!db.data.projects[projectName]) {
    db.data.projects[projectName] = [];
  }

  // Increment the specific counter
  const counterKey = type === 'VID' ? 'videoCounter' : 'audioCounter';
  db.data.projectConfig[projectName][counterKey] += 1;
  const currentCounter = db.data.projectConfig[projectName][counterKey];

  const entry: AssetEntry = {
    type: type, // 'VID' or 'AUD'
    system_filename: assetData.system_filename,
    original_filename: assetData.original_filename,
    hash: assetData.hash,
    r2_key: assetData.r2_key,
    size: assetData.size,
    counter: currentCounter,
    uploaded_at: new Date().toISOString(),
    status: 'active',
  };

  db.data.projects[projectName].push(entry);
  await db.write();
  return entry;
}

export function findAssetByHash(db: { data: ManifestData }, projectName: string, hash: string) {
  const projectAssets = db.data.projects[projectName] || [];
  return projectAssets.find((asset: AssetEntry) => asset.hash === hash);
}
