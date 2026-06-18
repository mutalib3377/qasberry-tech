'use client'
// components/admin/course-edit-form/index.tsx
// Edit form for an existing course — pre-populated with existing data.
// Supports updating basic info and managing curriculum (modules + lessons).
// Uses the same multi-step UX as the create form, but PATCH instead of POST.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  Plus, Trash2, GripVertical, CheckCircle, Loader2,
  Video, BookOpen, Lock, Unlock, Edit2, Save, Send, ImageIcon,
  Link as LinkIcon, FileText, AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Career    { id: string; name: string; slug: string }
interface LessonRow { id: string; title: string; isFree: boolean; order: number; videoUrl?: string | null; pdfUrl?: string | null; muxAssetId?: string | null; muxPlaybackId?: string | null; duration?: number | null; uploadStatus?: 'idle'|'uploading'|'processing'|'ready'|'error' }
interface ModuleRow { id: string; title: string; order: number; lessons: LessonRow[]; isExpanded: boolean }

interface CourseData {
  id: string
  title: string
  description?: string | null
  careerId: string
  difficulty: 'BEGINNER'|'INTERMEDIATE'|'ADVANCED'
  price: number | string
  isFree: boolean
  thumbnail?: string | null
  status: 'DRAFT'|'PUBLISHED'|'ARCHIVED'
  modules: Array<{
    id: string; title: string; order: number
    lessons: Array<{ id: string; title: string; isFree: boolean; order: number; muxAssetId?: string|null; muxPlaybackId?: string|null; duration?: number|null }>
  }>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseEditForm({ course, careers }: { course: CourseData; careers: Career[] }) {
  const router = useRouter()

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors'

  // Basic info state
  const [title, setTitle]         = useState(course.title)
  const [description, setDesc]    = useState(course.description ?? '')
  const [careerId, setCareerId]   = useState(course.careerId)
  const [difficulty, setDiff]     = useState(course.difficulty)
  const [price, setPrice]         = useState(Number(course.price))
  const [isFree, setIsFree]       = useState(course.isFree)
  const [thumbnail, setThumb]     = useState(course.thumbnail ?? '')
  const [savingInfo, setSavingInfo] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const thumbRef = useRef<HTMLInputElement>(null)

  // Curriculum state — normalise from DB
  const [modules, setModules] = useState<ModuleRow[]>(
    course.modules.map((m) => ({
      ...m,
      isExpanded: false,
      lessons: m.lessons.map((l) => ({ ...l, uploadStatus: l.muxPlaybackId ? 'ready' : l.muxAssetId ? 'processing' : 'idle' } as LessonRow)),
    }))
  )
  const [newModTitle, setNewModTitle]   = useState('')
  const [addingMod, setAddingMod]       = useState(false)
  const [savingLesson, setSavingLesson] = useState<string|null>(null)
  const [editingLesson, setEditingLesson] = useState<{moduleIdx:number;lessonIdx:number}|null>(null)

  // ── Thumbnail upload ──
  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5*1024*1024) { alert('Image must be under 5MB'); return }
    setUploadingThumb(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'qasberry_thumbnails')
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json() as { secure_url?: string }
      if (data.secure_url) setThumb(data.secure_url)
    } catch { alert('Upload failed') }
    finally { setUploadingThumb(false) }
  }

  // ── Save basic info ──
  async function saveBasicInfo() {
    setSavingInfo(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, careerId, difficulty, price, isFree, thumbnail: thumbnail || null }),
      })
      if (!res.ok) { const d = await res.json() as { error?: string }; alert(d.error ?? 'Save failed') }
      else router.refresh()
    } catch { alert('Network error') }
    finally { setSavingInfo(false) }
  }

  // ── Curriculum helpers ──
  function genId() { return `tmp_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }

  async function addModule() {
    if (!newModTitle.trim()) return
    setAddingMod(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ title: newModTitle.trim(), order: modules.length }),
      })
      const data = await res.json() as { success:boolean; data?: { id:string; title:string } }
      if (res.ok && data.data) {
        setModules(p => [...p, { id: data.data!.id, title: data.data!.title, order: p.length, lessons: [], isExpanded: true }])
        setNewModTitle('')
      }
    } catch { alert('Failed to add module') }
    finally { setAddingMod(false) }
  }

  async function deleteModule(i: number) {
    const m = modules[i]
    if (!confirm(`Delete module "${m.title}"?`)) return
    await fetch(`/api/admin/courses/${course.id}/modules/${m.id}`, { method:'DELETE' })
    setModules(p => p.filter((_,j) => j!==i))
  }

  async function addLesson(moduleIdx: number) {
    const m = modules[moduleIdx]
    const tempId = genId()
    setSavingLesson(tempId)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/modules/${m.id}/lessons`, {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ title: `Lesson ${m.lessons.length+1}`, order: m.lessons.length, isFree: false }),
      })
      const data = await res.json() as { success:boolean; data?: { id:string; title:string } }
      if (res.ok && data.data) {
        setModules(p => p.map((mod,i) => i===moduleIdx ? { ...mod, lessons: [...mod.lessons, { id: data.data!.id, title: data.data!.title, isFree:false, order: mod.lessons.length, uploadStatus:'idle' }] } : mod))
      }
    } catch { alert('Failed to add lesson') }
    finally { setSavingLesson(null) }
  }

  async function deleteLesson(moduleIdx: number, lessonIdx: number) {
    const m = modules[moduleIdx]; const l = m.lessons[lessonIdx]
    if (!confirm(`Delete lesson "${l.title}"?`)) return
    await fetch(`/api/admin/courses/${course.id}/modules/${m.id}/lessons/${l.id}`, { method:'DELETE' })
    setModules(p => p.map((mod,i) => i===moduleIdx ? { ...mod, lessons: mod.lessons.filter((_,j) => j!==lessonIdx) } : mod))
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    if (result.type === 'MODULE') {
      const r = [...modules]; const [removed] = r.splice(result.source.index,1); r.splice(result.destination.index,0,removed)
      setModules(r.map((m,i) => ({...m, order:i})))
    }
    if (result.type === 'LESSON') {
      const mi = parseInt(result.source.droppableId.replace('lessons-',''))
      const r  = [...modules[mi].lessons]; const [removed] = r.splice(result.source.index,1); r.splice(result.destination.index,0,removed)
      setModules(p => p.map((m,i) => i===mi ? {...m, lessons:r} : m))
    }
  }

  // ── Publish / unpublish ──
  async function setStatus(status: 'DRAFT'|'PUBLISHED') {
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { router.push(`/admin/courses/${course.id}`); router.refresh() }
    else alert('Failed to update status')
  }

  // ── Lesson editor ──
  const editMod    = editingLesson ? modules[editingLesson.moduleIdx] : null
  const editLesson = editingLesson ? modules[editingLesson.moduleIdx]?.lessons[editingLesson.lessonIdx] : null
  const [lessonTitle,    setLessonTitle]    = useState('')
  const [lessonFree,     setLessonFree]     = useState(false)
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [lessonPdfUrl,   setLessonPdfUrl]   = useState('')
  const [savingLessonEdit, setSavingLessonEdit] = useState(false)

  // URL helpers (shared)
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

  function openLesson(mi: number, li: number) {
    const l = modules[mi].lessons[li]
    setLessonTitle(l.title)
    setLessonFree(l.isFree)
    setLessonVideoUrl(l.videoUrl ?? '')
    setLessonPdfUrl(l.pdfUrl ?? '')
    setEditingLesson({ moduleIdx: mi, lessonIdx: li })
  }

  async function saveLesson() {
    if (!editingLesson || !editMod || !editLesson) return
    const videoUrlValid = !lessonVideoUrl || isValidUrl(lessonVideoUrl)
    const pdfUrlValid   = !lessonPdfUrl   || isValidUrl(lessonPdfUrl)
    if (!videoUrlValid) { alert('Please enter a valid video URL'); return }
    if (!pdfUrlValid)   { alert('Please enter a valid PDF URL'); return }
    setSavingLessonEdit(true)
    try {
      await fetch(`/api/admin/courses/${course.id}/modules/${editMod.id}/lessons/${editLesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          title:    lessonTitle,
          isFree:   lessonFree,
          videoUrl: lessonVideoUrl.trim() || null,
          pdfUrl:   lessonPdfUrl.trim()   || null,
        }),
      })
      setModules(p => p.map((m,mi) => mi===editingLesson.moduleIdx ? {
        ...m, lessons: m.lessons.map((l,li) => li===editingLesson.lessonIdx
          ? { ...l, title: lessonTitle, isFree: lessonFree, videoUrl: lessonVideoUrl.trim()||null, pdfUrl: lessonPdfUrl.trim()||null }
          : l)
      } : m))
      setEditingLesson(null)
    } catch { alert('Failed to save') }
    finally { setSavingLessonEdit(false) }
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Basic Info Panel ── */}
      <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Basic Information</h2>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
          <input className={inputCls} value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={description} onChange={e=>setDesc(e.target.value)} maxLength={2000} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Career</label>
            <select className={inputCls} value={careerId} onChange={e=>setCareerId(e.target.value)}>
              {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Difficulty</label>
            <select className={inputCls} value={difficulty} onChange={e=>setDiff(e.target.value as typeof difficulty)}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer" onClick={()=>setIsFree(!isFree)}>
            <div className={`relative w-10 h-5 rounded-full transition-colors ${isFree?'bg-violet-600':'bg-slate-700'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isFree?'translate-x-5':''}`} />
            </div>
            <span className="text-sm text-slate-300">Free course</span>
          </label>
          {!isFree && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">₦</span>
              <input type="number" min={0} step={100} className={`${inputCls} w-36`} value={price||''} onChange={e=>setPrice(Math.max(0,Number(e.target.value)))} />
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Thumbnail</label>
          {thumbnail ? (
            <div className="relative w-40 h-24 rounded-xl overflow-hidden border border-slate-700 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
              <button onClick={()=>setThumb('')} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity">
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ) : (
            <button type="button" onClick={()=>thumbRef.current?.click()} disabled={uploadingThumb}
              className="flex flex-col items-center justify-center w-40 h-24 rounded-xl border-2 border-dashed border-slate-700 hover:border-violet-500/50 text-slate-500 text-xs gap-1.5 transition-colors disabled:opacity-50">
              {uploadingThumb ? <Loader2 size={18} className="animate-spin"/> : <ImageIcon size={18} />}
              {uploadingThumb ? 'Uploading…' : 'Upload image'}
            </button>
          )}
          <input ref={thumbRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleThumbUpload} />
        </div>

        {/* Save basics */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={saveBasicInfo} disabled={savingInfo || !title.trim() || !careerId}
            className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {savingInfo ? <Loader2 size={13} className="animate-spin"/> : <Save size={13} />}
            Save Changes
          </button>
        </div>
      </section>

      {/* ── Curriculum Panel ── */}
      <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Curriculum</h2>

        {/* Lesson editor overlay */}
        {editingLesson && editMod && editLesson ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={()=>setEditingLesson(null)} className="text-slate-400 hover:text-white text-xs">← back</button>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{editMod.title}</span>
              <span className="text-slate-600">/</span>
              <span className="text-white">{editLesson.title}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Lesson Title</label>
              <input className={inputCls} value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer" onClick={()=>setLessonFree(!lessonFree)}>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${lessonFree?'bg-emerald-600':'bg-slate-700'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lessonFree?'translate-x-5':''}`} />
              </div>
              <span className="text-sm text-slate-300">Free preview</span>
            </label>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-5">

              {/* ── Video URL ── */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Video size={12} className="text-violet-400" /> Video Link
                </p>
                <div className="space-y-1.5">
                  <div className="relative">
                    <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border text-white text-xs placeholder-slate-600 focus:outline-none transition-colors ${
                        lessonVideoUrl && !isValidUrl(lessonVideoUrl)
                          ? 'border-red-500/60 focus:border-red-500'
                          : 'border-slate-700 focus:border-violet-500'
                      }`}
                      placeholder="Paste YouTube, Google Drive, Vimeo or Loom URL…"
                      value={lessonVideoUrl}
                      onChange={e => setLessonVideoUrl(e.target.value)}
                    />
                  </div>
                  {lessonVideoUrl && isValidUrl(lessonVideoUrl) && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={10} /> {getVideoProviderLabel(lessonVideoUrl)} — valid ✓
                    </p>
                  )}
                  {lessonVideoUrl && !isValidUrl(lessonVideoUrl) && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Enter a complete URL (https://…)
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-700 mt-1">YouTube · Google Drive · Vimeo · Loom</p>
              </div>

              {/* ── PDF URL ── */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText size={12} className="text-blue-400" /> PDF / Reading Material Link
                </p>
                <div className="space-y-1.5">
                  <div className="relative">
                    <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border text-white text-xs placeholder-slate-600 focus:outline-none transition-colors ${
                        lessonPdfUrl && !isValidUrl(lessonPdfUrl)
                          ? 'border-red-500/60 focus:border-red-500'
                          : 'border-slate-700 focus:border-violet-500'
                      }`}
                      placeholder="Paste Google Drive, Dropbox or direct PDF URL…"
                      value={lessonPdfUrl}
                      onChange={e => setLessonPdfUrl(e.target.value)}
                    />
                  </div>
                  {lessonPdfUrl && isValidUrl(lessonPdfUrl) && (
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <CheckCircle size={10} /> PDF link valid ✓
                    </p>
                  )}
                  {lessonPdfUrl && !isValidUrl(lessonPdfUrl) && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Enter a complete URL (https://…)
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-700 mt-1">Google Drive · Dropbox · any direct .pdf URL</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={()=>setEditingLesson(null)} className="px-4 py-2 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={saveLesson} disabled={savingLessonEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {savingLessonEdit ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                Save Lesson
              </button>
            </div>
          </div>
        ) : (
          <>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="modules" type="MODULE">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {modules.length === 0 && <div className="py-8 text-center text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">No modules yet</div>}
                    {modules.map((mod, mi) => (
                      <Draggable key={mod.id} draggableId={mod.id} index={mi}>
                        {(drag) => (
                          <div ref={drag.innerRef} {...drag.draggableProps} className="rounded-xl border border-slate-800 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50">
                              <span {...drag.dragHandleProps} className="text-slate-700 hover:text-slate-500 cursor-grab"><GripVertical size={14}/></span>
                              <BookOpen size={13} className="text-violet-400"/>
                              <span className="flex-1 text-white text-sm font-medium">{mod.title}</span>
                              <span className="text-slate-600 text-xs">{mod.lessons.length} lessons</span>
                              <button onClick={()=>setModules(p=>p.map((m,i)=>i===mi?{...m,isExpanded:!m.isExpanded}:m))} className="p-1 text-slate-500 hover:text-white">
                                {mod.isExpanded ? '▲' : '▼'}
                              </button>
                              <button onClick={()=>deleteModule(mi)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 size={13}/></button>
                            </div>
                            {mod.isExpanded && (
                              <div className="border-t border-slate-800 px-4 py-2 space-y-1">
                                <Droppable droppableId={`lessons-${mi}`} type="LESSON">
                                  {(ld) => (
                                    <div ref={ld.innerRef} {...ld.droppableProps} className="space-y-1">
                                      {mod.lessons.map((l, li) => (
                                        <Draggable key={l.id} draggableId={l.id} index={li}>
                                          {(lessonDrag) => (
                                            <div ref={lessonDrag.innerRef} {...lessonDrag.draggableProps} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/40 group">
                                              <span {...lessonDrag.dragHandleProps} className="text-slate-700 cursor-grab"><GripVertical size={12}/></span>
                                              <Video size={11} className="text-slate-600"/>
                                              <span className="flex-1 text-slate-300 text-xs">{l.title}</span>
                                              {l.isFree ? <Unlock size={10} className="text-emerald-400"/> : <Lock size={10} className="text-slate-700"/>}
                                              {(l.videoUrl || l.muxPlaybackId) && <CheckCircle size={10} className="text-emerald-400" aria-label="Video linked"/>}
                                              {l.pdfUrl && <FileText size={10} className="text-blue-400" aria-label="PDF linked"/>}
                                              <button onClick={()=>openLesson(mi,li)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-violet-400"><Edit2 size={11}/></button>
                                              <button onClick={()=>deleteLesson(mi,li)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400"><Trash2 size={11}/></button>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {ld.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                                <button onClick={()=>addLesson(mi)} disabled={savingLesson!==null}
                                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-violet-400 py-1 transition-colors">
                                  <Plus size={11}/> Add lesson
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
              <input className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="New module title…" value={newModTitle} onChange={e=>setNewModTitle(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') addModule() }} />
              <button onClick={addModule} disabled={addingMod||!newModTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {addingMod ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
                Add
              </button>
            </div>
          </>
        )}
      </section>

      {/* ── Publish Panel ── */}
      <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-sm">Course Status</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {course.status === 'PUBLISHED' ? 'This course is live and visible to students.' : 'This course is in draft mode — not visible to students.'}
          </p>
        </div>
        <div className="flex gap-3">
          {course.status === 'PUBLISHED' ? (
            <button onClick={()=>setStatus('DRAFT')}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-colors">
              <Save size={13}/> Unpublish
            </button>
          ) : (
            <button onClick={()=>setStatus('PUBLISHED')} disabled={modules.length===0}
              title={modules.length===0 ? 'Add at least one module before publishing' : ''}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
              <Send size={13}/> Publish
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
