'use client'
// components/admin/course-form/index.tsx
// Multi-step course creation form for Phase 2.
//
// Step 1: Basic info (title, description, career, difficulty, price, thumbnail)
// Step 2: Curriculum (modules + lessons, drag-to-reorder)
// Step 3: Lesson detail editor (video upload via Mux direct upload)
// Step 4: Review + Publish
//
// Course is created in Postgres on Step 1 completion, then modules/lessons
// are added live via API calls in Steps 2-3.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  Loader2,
  Video,
  Image as ImageIcon,
  BookOpen,
  Lock,
  Unlock,
  Edit2,
  Send,
  Save,
  Link as LinkIcon,
  FileText,
  AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Career {
  id: string
  name: string
  slug: string
}

interface LessonDraft {
  id?: string          // set after API creation
  tempId: string       // always present
  title: string
  isFree: boolean
  videoUrl?: string | null   // YouTube / Google Drive / Vimeo link
  pdfUrl?: string | null     // Google Drive / direct PDF link
  // Legacy Mux fields kept for backward-compat
  muxAssetId?: string | null
  muxPlaybackId?: string | null
  duration?: number | null
}

interface ModuleDraft {
  id?: string
  tempId: string
  title: string
  order: number
  lessons: LessonDraft[]
  isExpanded: boolean
}

interface BasicInfo {
  title: string
  description: string
  careerId: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  price: number
  isFree: boolean
  thumbnail: string
}

const STEPS = ['Basic Info', 'Curriculum', 'Lesson Details', 'Review & Publish']

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER' as const,     label: 'Beginner' },
  { value: 'INTERMEDIATE' as const, label: 'Intermediate' },
  { value: 'ADVANCED' as const,     label: 'Advanced' },
]

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done   ? 'bg-violet-600 text-white' :
                  active ? 'bg-violet-600/30 text-violet-300 ring-2 ring-violet-500/50' :
                           'bg-slate-800 text-slate-500'
                }`}
              >
                {done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px w-8 ${done ? 'bg-violet-600' : 'bg-slate-800'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function StepBasicInfo({
  info,
  careers,
  onChange,
  onNext,
  saving,
}: {
  info: BasicInfo
  careers: Career[]
  onChange: (info: BasicInfo) => void
  onNext: () => void
  saving: boolean
}) {
  const inputCls =
    'w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors'

  const [uploadingThumb, setUploadingThumb] = useState(false)
  const thumbRef = useRef<HTMLInputElement>(null)

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.')
      return
    }
    setUploadingThumb(true)
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const preset    = 'qasberry_thumbnails'
      const formData  = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', preset)
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json() as { secure_url?: string; error?: { message: string } }
      if (!res.ok || !data.secure_url) throw new Error(data.error?.message ?? 'Upload failed')
      onChange({ ...info, thumbnail: data.secure_url })
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUploadingThumb(false)
    }
  }

  const isValid = info.title.trim().length >= 3 && info.careerId

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Course Title <span className="text-red-400">*</span>
        </label>
        <input
          className={inputCls}
          placeholder="e.g. AI Tools for Nurses: From Basics to Practice"
          value={info.title}
          onChange={(e) => onChange({ ...info, title: e.target.value })}
          maxLength={120}
        />
        <p className="text-xs text-slate-600 mt-1">{info.title.length}/120</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder="What will students learn in this course?"
          value={info.description}
          onChange={(e) => onChange({ ...info, description: e.target.value })}
          maxLength={2000}
        />
        <p className="text-xs text-slate-600 mt-1">{info.description.length}/2000</p>
      </div>

      {/* Career + Difficulty row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Career <span className="text-red-400">*</span>
          </label>
          <select
            className={inputCls}
            value={info.careerId}
            onChange={(e) => onChange({ ...info, careerId: e.target.value })}
          >
            <option value="">Select a career…</option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Difficulty</label>
          <select
            className={inputCls}
            value={info.difficulty}
            onChange={(e) => onChange({ ...info, difficulty: e.target.value as BasicInfo['difficulty'] })}
          >
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Price / Free toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Pricing</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onChange({ ...info, isFree: !info.isFree, price: info.isFree ? info.price : 0 })}
              className={`relative w-10 h-5 rounded-full transition-colors ${info.isFree ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${info.isFree ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-slate-300">Free course</span>
          </label>
          {!info.isFree && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">₦</span>
              <input
                type="number"
                min={0}
                step={100}
                placeholder="10000"
                className={`${inputCls} w-36`}
                value={info.price || ''}
                onChange={(e) => onChange({ ...info, price: Math.max(0, Number(e.target.value)) })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Course Thumbnail</label>
        {info.thumbnail ? (
          <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-700 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange({ ...info, thumbnail: '' })}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => thumbRef.current?.click()}
            disabled={uploadingThumb}
            className="flex flex-col items-center justify-center w-48 h-28 rounded-xl border-2 border-dashed border-slate-700 hover:border-violet-500/50 text-slate-500 hover:text-slate-400 transition-colors gap-2 text-sm"
          >
            {uploadingThumb ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ImageIcon size={20} />
            )}
            <span>{uploadingThumb ? 'Uploading…' : 'Upload thumbnail'}</span>
            <span className="text-xs text-slate-600">JPG/PNG/WebP · max 5MB</span>
          </button>
        )}
        <input
          ref={thumbRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleThumbUpload}
        />
      </div>

      {/* Next button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!isValid || saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          {saving ? 'Creating…' : 'Next: Curriculum'}
          {!saving && <ChevronRight size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Curriculum ───────────────────────────────────────────────────────

function StepCurriculum({
  courseId,
  modules,
  setModules,
  onBack,
  onNext,
  onSelectLesson,
}: {
  courseId: string
  modules: ModuleDraft[]
  setModules: React.Dispatch<React.SetStateAction<ModuleDraft[]>>
  onBack: () => void
  onNext: () => void
  onSelectLesson: (moduleIdx: number, lessonIdx: number) => void
}) {
  const [addingModule, setAddingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [savingLesson, setSavingLesson] = useState<string | null>(null)

  function genTempId() {
    return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleTitle.trim(), order: modules.length }),
      })
      const data = await res.json() as { success: boolean; data?: { id: string; title: string } }
      if (res.ok && data.success && data.data) {
        setModules((prev) => [
          ...prev,
          {
            id: data.data!.id,
            tempId: genTempId(),
            title: data.data!.title,
            order: prev.length,
            lessons: [],
            isExpanded: true,
          },
        ])
        setNewModuleTitle('')
      }
    } catch {
      alert('Failed to create module')
    } finally {
      setAddingModule(false)
    }
  }

  async function deleteModule(idx: number) {
    const mod = modules[idx]
    if (!mod.id) return
    if (!confirm(`Delete module "${mod.title}"? All lessons inside will be deleted.`)) return
    try {
      await fetch(`/api/admin/courses/${courseId}/modules/${mod.id}`, { method: 'DELETE' })
      setModules((prev) => prev.filter((_, i) => i !== idx))
    } catch {
      alert('Failed to delete module')
    }
  }

  async function addLesson(moduleIdx: number) {
    const mod = modules[moduleIdx]
    if (!mod.id) return
    const tempId = genTempId()
    setSavingLesson(tempId)
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${mod.id}/lessons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Lesson ${mod.lessons.length + 1}`,
            order: mod.lessons.length,
            isFree: false,
          }),
        }
      )
      const data = await res.json() as { success: boolean; data?: { id: string; title: string } }
      if (res.ok && data.success && data.data) {
        setModules((prev) =>
          prev.map((m, i) =>
            i === moduleIdx
              ? {
                  ...m,
                  lessons: [
                    ...m.lessons,
                    {
                      id: data.data!.id,
                      tempId,
                      title: data.data!.title,
                      isFree: false,
                      uploadStatus: 'idle',
                    },
                  ],
                }
              : m
          )
        )
      }
    } catch {
      alert('Failed to add lesson')
    } finally {
      setSavingLesson(null)
    }
  }

  async function deleteLesson(moduleIdx: number, lessonIdx: number) {
    const mod    = modules[moduleIdx]
    const lesson = mod.lessons[lessonIdx]
    if (!mod.id || !lesson.id) return
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return
    try {
      await fetch(
        `/api/admin/courses/${courseId}/modules/${mod.id}/lessons/${lesson.id}`,
        { method: 'DELETE' }
      )
      setModules((prev) =>
        prev.map((m, i) =>
          i === moduleIdx ? { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIdx) } : m
        )
      )
    } catch {
      alert('Failed to delete lesson')
    }
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { source, destination, type } = result
    if (type === 'MODULE') {
      const reordered = Array.from(modules)
      const [removed] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, removed)
      setModules(reordered.map((m, i) => ({ ...m, order: i })))
    }
    if (type === 'LESSON') {
      const moduleIdx = parseInt(source.droppableId.replace('lessons-', ''))
      const reordered = Array.from(modules[moduleIdx].lessons)
      const [removed] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, removed)
      setModules((prev) =>
        prev.map((m, i) => (i === moduleIdx ? { ...m, lessons: reordered } : m))
      )
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm">
        Build your course curriculum by adding modules and lessons. Drag to reorder.
      </p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="modules" type="MODULE">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {modules.length === 0 && (
                <div className="py-10 text-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                  No modules yet — add one below
                </div>
              )}
              {modules.map((mod, moduleIdx) => (
                <Draggable key={mod.tempId} draggableId={mod.tempId} index={moduleIdx}>
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                    >
                      {/* Module header */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span {...drag.dragHandleProps} className="text-slate-600 hover:text-slate-400 cursor-grab">
                          <GripVertical size={16} />
                        </span>
                        <BookOpen size={14} className="text-violet-400 flex-shrink-0" />
                        <span className="flex-1 text-white text-sm font-medium">{mod.title}</span>
                        <span className="text-slate-600 text-xs">{mod.lessons.length} lessons</span>
                        <button
                          onClick={() =>
                            setModules((prev) =>
                              prev.map((m, i) => (i === moduleIdx ? { ...m, isExpanded: !m.isExpanded } : m))
                            )
                          }
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          {mod.isExpanded ? <ChevronLeft size={14} className="rotate-90" /> : <ChevronRight size={14} className="rotate-90" />}
                        </button>
                        <button
                          onClick={() => deleteModule(moduleIdx)}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Lessons */}
                      {mod.isExpanded && (
                        <div className="border-t border-slate-800 px-4 py-3 space-y-2">
                          <Droppable droppableId={`lessons-${moduleIdx}`} type="LESSON">
                            {(lessonDrop) => (
                              <div ref={lessonDrop.innerRef} {...lessonDrop.droppableProps} className="space-y-2">
                                {mod.lessons.map((lesson, lessonIdx) => (
                                  <Draggable
                                    key={lesson.tempId}
                                    draggableId={lesson.tempId}
                                    index={lessonIdx}
                                  >
                                    {(lessonDrag) => (
                                      <div
                                        ref={lessonDrag.innerRef}
                                        {...lessonDrag.draggableProps}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 group"
                                      >
                                        <span {...lessonDrag.dragHandleProps} className="text-slate-700 hover:text-slate-500 cursor-grab">
                                          <GripVertical size={13} />
                                        </span>
                                        <Video size={12} className="text-slate-500 flex-shrink-0" />
                                        <span className="flex-1 text-slate-300 text-xs">{lesson.title}</span>
                                        {lesson.isFree ? (
                                          <Unlock size={11} className="text-emerald-400" aria-label="Free preview" />
                                        ) : (
                                          <Lock size={11} className="text-slate-600" />
                                        )}
                                        {(lesson.videoUrl || lesson.muxPlaybackId) && (
                                          <CheckCircle size={11} className="text-emerald-400" aria-label="Video linked" />
                                        )}
                                        {lesson.pdfUrl && (
                                          <FileText size={11} className="text-blue-400" aria-label="PDF linked" />
                                        )}
                                        <button
                                          onClick={() => onSelectLesson(moduleIdx, lessonIdx)}
                                          className="p-1 text-slate-500 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          onClick={() => deleteLesson(moduleIdx, lessonIdx)}
                                          className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {lessonDrop.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <button
                            onClick={() => addLesson(moduleIdx)}
                            disabled={savingLesson !== null || !mod.id}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors py-1 disabled:opacity-50"
                          >
                            {savingLesson ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                            Add lesson
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add module */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="New module title…"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addModule() }}
        />
        <button
          onClick={addModule}
          disabled={addingModule || !newModuleTitle.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {addingModule ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add Module
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium rounded-xl transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Next: Review <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Lesson Detail Editor ─────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

function getVideoProviderLabel(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  if (url.includes('drive.google.com')) return 'Google Drive'
  if (url.includes('vimeo.com')) return 'Vimeo'
  if (url.includes('loom.com')) return 'Loom'
  return 'External video'
}

function StepLessonDetail({
  courseId,
  moduleIdx,
  lessonIdx,
  modules,
  setModules,
  onBack,
}: {
  courseId: string
  moduleIdx: number
  lessonIdx: number
  modules: ModuleDraft[]
  setModules: React.Dispatch<React.SetStateAction<ModuleDraft[]>>
  onBack: () => void
}) {
  const mod    = modules[moduleIdx]
  const lesson = mod?.lessons[lessonIdx]

  const [saving,   setSaving]   = useState(false)
  const [title,    setTitle]    = useState(lesson?.title    ?? '')
  const [isFree,   setIsFree]   = useState(lesson?.isFree   ?? false)
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '')
  const [pdfUrl,   setPdfUrl]   = useState(lesson?.pdfUrl   ?? '')

  if (!lesson || !mod) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Lesson not found.</p>
        <button onClick={onBack} className="mt-4 text-violet-400 text-sm hover:underline">← Back</button>
      </div>
    )
  }

  const videoUrlValid = !videoUrl || isValidUrl(videoUrl)
  const pdfUrlValid   = !pdfUrl   || isValidUrl(pdfUrl)

  async function save() {
    if (!mod?.id || !lesson?.id) return
    if (!videoUrlValid) { alert('Please enter a valid video URL (e.g. https://youtube.com/...)'); return }
    if (!pdfUrlValid)   { alert('Please enter a valid PDF URL (e.g. https://drive.google.com/...)'); return }
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${mod.id}/lessons/${lesson.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            isFree,
            videoUrl: videoUrl.trim() || null,
            pdfUrl:   pdfUrl.trim()   || null,
          }),
        }
      )
      if (res.ok) {
        setModules((prev) =>
          prev.map((m, mi) =>
            mi === moduleIdx
              ? {
                  ...m,
                  lessons: m.lessons.map((l, li) =>
                    li === lessonIdx
                      ? { ...l, title, isFree, videoUrl: videoUrl.trim() || null, pdfUrl: pdfUrl.trim() || null }
                      : l
                  ),
                }
              : m
          )
        )
        onBack()
      } else {
        const d = await res.json() as { error?: string }
        alert(d.error ?? 'Failed to save lesson')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="text-white font-semibold">Edit Lesson</h2>
          <p className="text-xs text-slate-500">{mod.title}</p>
        </div>
      </div>

      {/* Lesson Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Lesson Title</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </div>

      {/* Free preview toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setIsFree(!isFree)}>
          <div className={`relative w-10 h-5 rounded-full transition-colors ${isFree ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isFree ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-slate-300">Free preview lesson</span>
        </label>
        <span className="text-xs text-slate-600">(non-enrolled users can watch this)</span>
      </div>

      {/* ── Video URL ── */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
          <Video size={14} className="text-violet-400" /> Video Link
        </label>
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className={`${inputCls} pl-9 ${videoUrl && !videoUrlValid ? 'border-red-500/60 focus:border-red-500' : ''}`}
              placeholder="Paste YouTube, Google Drive, Vimeo or Loom URL…"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          {videoUrl && videoUrlValid && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle size={11} /> {getVideoProviderLabel(videoUrl)} — link valid ✓
            </p>
          )}
          {videoUrl && !videoUrlValid && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={11} /> Enter a complete URL starting with https://
            </p>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-1.5">
          Supported: YouTube · Google Drive (share as &quot;Anyone with link&quot;) · Vimeo · Loom · any direct video URL
        </p>
      </div>

      {/* ── PDF / Reading Material URL ── */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
          <FileText size={14} className="text-blue-400" /> PDF / Reading Material Link
        </label>
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className={`${inputCls} pl-9 ${pdfUrl && !pdfUrlValid ? 'border-red-500/60 focus:border-red-500' : ''}`}
              placeholder="Paste Google Drive, Dropbox or direct PDF URL…"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
            />
          </div>
          {pdfUrl && pdfUrlValid && (
            <p className="text-xs text-blue-400 flex items-center gap-1">
              <CheckCircle size={11} /> PDF link valid ✓
            </p>
          )}
          {pdfUrl && !pdfUrlValid && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={11} /> Enter a complete URL starting with https://
            </p>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-1.5">
          Supported: Google Drive (share as &quot;Anyone with link&quot;) · Dropbox · any direct .pdf URL
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !videoUrlValid || !pdfUrlValid}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Lesson
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Review + Publish ─────────────────────────────────────────────────


function StepReview({
  courseId,
  info,
  modules,
  careers,
  onBack,
}: {
  courseId: string
  info: BasicInfo
  modules: ModuleDraft[]
  careers: Career[]
  onBack: () => void
}) {
  const [publishing, setPublishing] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const router = useRouter()

  const careerName = careers.find((c) => c.id === info.careerId)?.name ?? ''

  async function save(status: 'DRAFT' | 'PUBLISHED') {
    status === 'PUBLISHED' ? setPublishing(true) : setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        router.push('/admin/courses')
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to save')
      }
    } catch {
      alert('Network error')
    } finally {
      setPublishing(false)
      setSaving(false)
    }
  }

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0)

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        {/* Thumbnail + basic */}
        <div className="flex gap-5">
          {info.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.thumbnail} alt="Thumbnail" className="w-32 h-20 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-32 h-20 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={20} className="text-slate-600" />
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-white font-bold text-lg">{info.title}</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">{careerName}</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">{info.difficulty}</span>
              <span className={`px-2 py-0.5 rounded-lg ${info.isFree ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {info.isFree ? 'Free' : `₦${info.price.toLocaleString()}`}
              </span>
            </div>
            {info.description && (
              <p className="text-slate-400 text-sm line-clamp-2">{info.description}</p>
            )}
          </div>
        </div>

        {/* Curriculum summary */}
        <div className="border-t border-slate-800 pt-4">
          <p className="text-sm font-medium text-slate-300 mb-3">
            {modules.length} modules · {totalLessons} lessons
          </p>
          <div className="space-y-2">
            {modules.map((mod) => (
              <div key={mod.tempId}>
                <p className="text-sm text-white font-medium">{mod.title}</p>
                <div className="ml-4 mt-1 space-y-0.5">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.tempId} className="flex items-center gap-2 text-xs text-slate-500">
                      <Video size={10} />
                      <span>{lesson.title}</span>
                      {lesson.isFree && <span className="text-emerald-500">• Free</span>}
                      {lesson.muxPlaybackId && <CheckCircle size={10} className="text-emerald-400" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => save('DRAFT')}
            disabled={saving || publishing}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-600 hover:border-slate-500 disabled:opacity-50 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save as Draft
          </button>
          <button
            onClick={() => save('PUBLISHED')}
            disabled={saving || publishing || modules.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            title={modules.length === 0 ? 'Add at least one module before publishing' : ''}
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish Course
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main CourseForm ───────────────────────────────────────────────────────────

export function CourseForm({ careers }: { careers: Career[] }) {
  const [step, setStep]         = useState(0)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [modules, setModules]   = useState<ModuleDraft[]>([])

  // Lesson editor state (step 2.5)
  const [editingLesson, setEditingLesson] = useState<{ moduleIdx: number; lessonIdx: number } | null>(null)

  const [info, setInfo] = useState<BasicInfo>({
    title:       '',
    description: '',
    careerId:    '',
    difficulty:  'BEGINNER',
    price:       0,
    isFree:      false,
    thumbnail:   '',
  })

  async function handleStep1Next() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       info.title,
          description: info.description || undefined,
          careerId:    info.careerId,
          difficulty:  info.difficulty,
          price:       info.price,
          isFree:      info.isFree,
          thumbnail:   info.thumbnail || undefined,
        }),
      })
      const data = await res.json() as { success: boolean; data?: { id: string }, error?: string }
      if (res.ok && data.success && data.data) {
        setCourseId(data.data.id)
        setStep(1)
      } else {
        alert(data.error || 'Failed to create course. Please check all fields.')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  // Edit lesson — shows Step 3 overlay
  function handleSelectLesson(moduleIdx: number, lessonIdx: number) {
    setEditingLesson({ moduleIdx, lessonIdx })
    setStep(2)
  }

  function handleLessonBack() {
    setEditingLesson(null)
    setStep(1)
  }

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30">
      <StepIndicator current={step > 2 ? step - 1 : step} />

      {step === 0 && (
        <StepBasicInfo
          info={info}
          careers={careers}
          onChange={setInfo}
          onNext={handleStep1Next}
          saving={saving}
        />
      )}

      {step === 1 && courseId && (
        <StepCurriculum
          courseId={courseId}
          modules={modules}
          setModules={setModules}
          onBack={() => setStep(0)}
          onNext={() => setStep(3)}
          onSelectLesson={handleSelectLesson}
        />
      )}

      {step === 2 && courseId && editingLesson && (
        <StepLessonDetail
          courseId={courseId}
          moduleIdx={editingLesson.moduleIdx}
          lessonIdx={editingLesson.lessonIdx}
          modules={modules}
          setModules={setModules}
          onBack={handleLessonBack}
        />
      )}

      {step === 3 && courseId && (
        <StepReview
          courseId={courseId}
          info={info}
          modules={modules}
          careers={careers}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  )
}
