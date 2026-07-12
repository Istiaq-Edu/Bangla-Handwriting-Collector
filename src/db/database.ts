import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Contributor, Sample, Settings } from '../types'

export type SampleData = Sample

interface BanglaHandwritingDB extends DBSchema {
  samples: {
    key: string
    value: Sample
    indexes: {
      'by-character': string
      'by-characterId': number
      'by-createdAt': number
      'by-contributor': string
      'by-category': string
    }
  }
  contributor: {
    key: string
    value: Contributor
  }
  settings: {
    key: string
    value: Settings
  }
}

const DB_NAME = 'bangla-handwriting'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<BanglaHandwritingDB> | null = null

export async function getDB(): Promise<IDBPDatabase<BanglaHandwritingDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<BanglaHandwritingDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const sampleStore = db.createObjectStore('samples', {
        keyPath: 'id',
      })
      sampleStore.createIndex('by-character', 'character')
      sampleStore.createIndex('by-characterId', 'characterId')
      sampleStore.createIndex('by-createdAt', 'createdAt')
      sampleStore.createIndex('by-contributor', 'contributorId')
      sampleStore.createIndex('by-category', 'category')

      db.createObjectStore('contributor', { keyPath: 'id' })
      db.createObjectStore('settings', { keyPath: 'theme' })
    },
  })

  return dbInstance
}

export async function saveSample(sample: Sample): Promise<void> {
  const db = await getDB()
  await db.put('samples', sample)
}

export async function getSampleById(id: string): Promise<Sample | undefined> {
  const db = await getDB()
  return db.get('samples', id)
}

export async function getAllSamples(): Promise<Sample[]> {
  const db = await getDB()
  return db.getAll('samples')
}

export async function getSamplesByCharacter(characterId: number): Promise<Sample[]> {
  const db = await getDB()
  return db.getAllFromIndex('samples', 'by-characterId', characterId)
}

export async function getSampleCountByCharacter(characterId: number): Promise<number> {
  const db = await getDB()
  return db.countFromIndex('samples', 'by-characterId', characterId)
}

export async function getAllSampleCounts(): Promise<Map<number, number>> {
  const db = await getDB()
  const allSamples = await db.getAll('samples')
  const counts = new Map<number, number>()
  for (const sample of allSamples) {
    counts.set(sample.characterId, (counts.get(sample.characterId) ?? 0) + 1)
  }
  return counts
}

export async function deleteSample(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('samples', id)
}

export async function deleteAllSamples(): Promise<void> {
  const db = await getDB()
  await db.clear('samples')
}

export async function saveContributor(contributor: Contributor): Promise<void> {
  const db = await getDB()
  await db.put('contributor', contributor)
}

export async function getContributor(id: string): Promise<Contributor | undefined> {
  const db = await getDB()
  return db.get('contributor', id)
}

export async function getTotalSampleCount(): Promise<number> {
  const db = await getDB()
  return db.count('samples')
}
