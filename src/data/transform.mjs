import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// The source JSON is two levels up from src/data/ -> go to the yoga app directory
const rawData = JSON.parse(readFileSync(join(__dirname, '../../../iyengar-course-data.json'), 'utf-8'))

/**
 * Normalize a pose name into a slug:
 * - Remove page references like "(p. 22)" or "(p. 22); ..."
 * - Remove instruction suffixes like "× 6–8"
 * - Remove diacritics
 * - Lowercase, replace spaces with hyphens, remove non-alphanumeric except hyphens
 */
function toSlug(name) {
  // Remove parenthetical page refs like (p. 22) or (p. 22); anything after
  let clean = name.replace(/\s*\(p\.\s*\d+\)[^)]*$/g, '')
  // Remove any remaining parenthetical suffixes
  clean = clean.replace(/\s*\([^)]+\)\s*$/g, '')
  // Remove multiplication/repeat instructions like × 6–8
  clean = clean.replace(/\s*[×x]\s*[\d–-]+.*$/g, '')
  // Remove trailing semicolons and anything after
  clean = clean.replace(/\s*;.*$/, '')
  // Trim
  clean = clean.trim()

  // Remove diacritics - comprehensive mapping for yoga/Sanskrit characters
  const diacriticMap = {
    'ā': 'a', 'Ā': 'a',
    'ī': 'i', 'Ī': 'i',
    'ū': 'u', 'Ū': 'u',
    'ṛ': 'r', 'Ṛ': 'r',
    'ṝ': 'r', 'Ṝ': 'r',
    'ḷ': 'l', 'Ḷ': 'l',
    'ṣ': 's', 'Ṣ': 's',
    'ś': 's', 'Ś': 's',
    'ṇ': 'n', 'Ṇ': 'n',
    'ñ': 'n', 'Ñ': 'n',
    'ṅ': 'n', 'Ṅ': 'n',
    'ṭ': 't', 'Ṭ': 't',
    'ḍ': 'd', 'Ḍ': 'd',
    'ḥ': 'h', 'Ḥ': 'h',
    'ṃ': 'm', 'Ṃ': 'm',
    'ṁ': 'm', 'Ṁ': 'm',
    'ḫ': 'h',
    'ṉ': 'n',
    'ṯ': 't',
  }

  let result = ''
  for (const char of clean) {
    result += diacriticMap[char] ?? char
  }

  // Lowercase
  result = result.toLowerCase()
  // Replace spaces and underscores with hyphens
  result = result.replace(/[\s_]+/g, '-')
  // Remove non-alphanumeric except hyphens
  result = result.replace(/[^a-z0-9-]/g, '')
  // Deduplicate consecutive hyphens
  result = result.replace(/-+/g, '-')
  // Trim leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, '')

  return result
}

/**
 * Extract clean display name (remove page refs but keep the human-readable name)
 */
function cleanDisplayName(name) {
  // Remove parenthetical page refs at end
  let clean = name.replace(/\s*\(p\.\s*\d+\)\s*$/, '')
  // Remove trailing semicolons and anything after
  // (but keep the first part for display)
  // Actually keep the full name for display, just trim trailing refs
  clean = clean.trim()
  return clean
}

/**
 * Extract page number from a pose name string like "Trikonasana (p. 22)"
 * Returns null if not found.
 */
function extractPageFromName(name) {
  const match = name.match(/\(p\.\s*(\d+)\)/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Extract clean pose name (strip page refs from name field)
 */
function extractPoseName(name) {
  // Remove page refs like "(p. 22)" or "(p. 22); rest"
  let clean = name.replace(/\s*\(p\.\s*\d+\)[^)]*$/g, '')
  clean = clean.replace(/\s*\([^)]+\)\s*$/, '')
  clean = clean.replace(/\s*;.*$/, '')
  return clean.trim()
}

// Collect all poses across all courses
const posesMap = new Map() // slug -> { id, nameRomanised, references: [{sourceId, page}] }

function processPose(poseEntry) {
  const rawName = poseEntry.name
  const pageFromField = poseEntry.page || null

  // Extract clean name for slug generation
  const cleanName = extractPoseName(rawName)
  const slug = toSlug(cleanName)

  if (!slug) return null

  // Page number: prefer the explicit page field
  const page = pageFromField || extractPageFromName(rawName)

  if (!posesMap.has(slug)) {
    posesMap.set(slug, {
      id: slug,
      nameRomanised: cleanName,
      references: page ? [{ sourceId: 'yoga-iyengar-way', page }] : [],
    })
  }

  return {
    poseId: slug,
    displayName: cleanDisplayName(rawName),
    canonicalPage: page || undefined,
    note: poseEntry.note || undefined,
  }
}

// Build programs
const programs = []
const now = new Date().toISOString()

for (const course of rawData.courses) {
  let programId, programName, programSubtitle

  if (course.id === 'course-1') {
    programId = 'iyengar-way-course-1'
    programName = 'Yoga the Iyengar Way — Course I'
    programSubtitle = 'Foundation'
  } else if (course.id === 'course-2') {
    programId = 'iyengar-way-course-2'
    programName = 'Yoga the Iyengar Way — Course II'
    programSubtitle = 'General Practice'
  } else {
    programId = `iyengar-way-${course.id}`
    programName = `Yoga the Iyengar Way — ${course.name}`
    programSubtitle = course.subtitle
  }

  const lessons = []

  if (course.lessons) {
    // Flat lessons array (Course 1)
    for (const lesson of course.lessons) {
      const lessonPoses = []
      for (const poseEntry of lesson.poses) {
        const lp = processPose(poseEntry)
        if (lp) lessonPoses.push(lp)
      }
      lessons.push({
        id: lesson.id,
        label: lesson.label || `Lesson ${lesson.id}`,
        poses: lessonPoses,
        instructorNotes: lesson.instructorNotes || undefined,
        estimatedMinutes: lesson.estimatedMinutes || undefined,
      })
    }
  } else if (course.lessonGroups) {
    // Nested lesson groups (Course 2) — flatten
    for (const group of course.lessonGroups) {
      for (const lesson of group.lessons) {
        const lessonPoses = []
        for (const poseEntry of lesson.poses) {
          const lp = processPose(poseEntry)
          if (lp) lessonPoses.push(lp)
        }
        lessons.push({
          id: lesson.id,
          label: lesson.label || `Lesson ${lesson.id}`,
          poses: lessonPoses,
          instructorNotes: lesson.instructorNotes || undefined,
          estimatedMinutes: lesson.estimatedMinutes || undefined,
        })
      }
    }
  }

  programs.push({
    id: programId,
    name: programName,
    subtitle: programSubtitle,
    practiceType: 'asana',
    canonicalSourceId: 'yoga-iyengar-way',
    tier: 'free',
    schemeOfPractice: course.schemeOfPractice || undefined,
    cautions: course.caution ? [course.caution] : undefined,
    lessons,
    createdAt: now,
    updatedAt: now,
  })
}

// Convert posesMap to array
const poses = Array.from(posesMap.values())

// Write output files
writeFileSync(
  join(__dirname, 'poses.json'),
  JSON.stringify(poses, null, 2),
  'utf-8'
)

writeFileSync(
  join(__dirname, 'programs.json'),
  JSON.stringify(programs, null, 2),
  'utf-8'
)

console.log(`Generated ${poses.length} poses`)
console.log(`Generated ${programs.length} programs`)
for (const p of programs) {
  console.log(`  ${p.id}: ${p.lessons.length} lessons`)
}
