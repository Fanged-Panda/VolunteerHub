import React, { useMemo, useRef, useState } from 'react';

const blankForm = {
  id: null,
  title: '',
  date: '',
  location: '',
  neededVolunteers: '',
  imageUrl: '',
  details: '',
};

// Keep payload within common TEXT limits so uploads work even without LONGTEXT migration.
const MAX_IMAGE_PAYLOAD_BYTES = 62_000;
const IMAGE_MAX_EDGE = 1600;

function mapEventToForm(event) {
  return {
    id: event.id,
    title: event.title || '',
    date: event.date || '',
    location: event.location || '',
    neededVolunteers: Number(event.needed_volunteers || event.neededVolunteers || 1),
    imageUrl: event.image_url || event.imageUrl || '',
    details: event.details || '',
  };
}

function normalizeAssignedTasks(tasks, fallbackCompleted = false) {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .map((task) => {
      if (task && typeof task === 'object') {
        const title = String(task.title ?? task.task ?? '').trim();
        if (!title) return null;
        return {
          title,
          completed: Boolean(task.completed),
        };
      }

      const title = String(task || '').trim();
      if (!title) return null;
      return {
        title,
        completed: Boolean(fallbackCompleted),
      };
    })
    .filter(Boolean);
}

function estimateDataUrlBytes(dataUrl) {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not process image.'));
    image.src = dataUrl;
  });
}

function encodeImage(image, scale, quality) {
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function CoordinatorDashboard({
  currentUser,
  myEvents = [],
  applications = [],
  onCreateOrUpdateEvent,
  onDecision,
  onAssignment,
}) {
  const [createForm, setCreateForm] = useState(blankForm);
  const [editForm, setEditForm] = useState(blankForm);
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [createImageName, setCreateImageName] = useState('');
  const [editImageName, setEditImageName] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [selectedApplicantEvent, setSelectedApplicantEvent] = useState('all');
  const [applicantView, setApplicantView] = useState('applicants');
  const createImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);

  const isApproved = Boolean(currentUser?.coordinatorApproved);

  const visibleApplicants = useMemo(
    () => applications.filter((application) => application.status !== 'Rejected'),
    [applications],
  );

  const applicantCounts = useMemo(() => {
    const applicants = visibleApplicants.filter((application) => application.status === 'Applied').length;
    const volunteers = visibleApplicants.filter((application) => application.status === 'Approved').length;
    return {
      applicants,
      volunteers,
    };
  }, [visibleApplicants]);

  const filteredApplicants = useMemo(() => {
    return visibleApplicants.filter((application) => {
      const eventMatch = selectedApplicantEvent === 'all' || String(application.eventId) === selectedApplicantEvent;
      const viewMatch = applicantView === 'applicants'
        ? application.status === 'Applied'
        : application.status === 'Approved';
      return eventMatch && viewMatch;
    });
  }, [visibleApplicants, selectedApplicantEvent, applicantView]);

  const todayKey = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const currentEvents = useMemo(() => myEvents.filter((event) => event.date >= todayKey), [myEvents, todayKey]);
  const pastEvents = useMemo(() => myEvents.filter((event) => event.date < todayKey), [myEvents, todayKey]);

  function validate(formValues, setErrors) {
    const nextErrors = {};
    if (!formValues.title.trim()) nextErrors.title = 'Title is required.';
    if (!formValues.date.trim()) nextErrors.date = 'Date is required.';
    if (!formValues.location.trim()) nextErrors.location = 'Location is required.';
    const needed = Number(formValues.neededVolunteers);
    if (!Number.isInteger(needed) || needed < 1) {
      nextErrors.neededVolunteers = 'Volunteers needed must be at least 1.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function toDataUrl(file) {
    return (async () => {
      if (!String(file?.type || '').startsWith('image/')) {
        throw new Error('Please choose a valid image file.');
      }

      const sourceDataUrl = await readFileAsDataUrl(file);
      if (estimateDataUrlBytes(sourceDataUrl) <= MAX_IMAGE_PAYLOAD_BYTES) {
        return sourceDataUrl;
      }

      let image;
      try {
        image = await loadImageFromDataUrl(sourceDataUrl);
      } catch {
        throw new Error('Image format is not supported. Try JPG or PNG.');
      }

      const maxEdge = Math.max(image.width || 1, image.height || 1);
      const naturalScale = maxEdge > IMAGE_MAX_EDGE ? IMAGE_MAX_EDGE / maxEdge : 1;
      let optimized = sourceDataUrl;
      for (let index = 0; index < 12; index += 1) {
        const scaleFactor = Math.max(0.12, 1 - index * 0.08);
        const quality = Math.max(0.32, 0.86 - index * 0.05);
        const scale = Math.min(naturalScale, naturalScale * scaleFactor);

        optimized = encodeImage(image, scale, quality);
        if (estimateDataUrlBytes(optimized) <= MAX_IMAGE_PAYLOAD_BYTES) {
          return optimized;
        }
      }

      if (estimateDataUrlBytes(optimized) > MAX_IMAGE_PAYLOAD_BYTES) {
        throw new Error('Image is too large. Please choose a smaller image (JPG/PNG recommended).');
      }

      return optimized;
    })();
  }

  async function saveCreateEvent(e) {
    e.preventDefault();
    if (!validate(createForm, setCreateErrors)) return;

    setSavingCreate(true);
    setActionError('');
    const payload = {
      ...createForm,
      neededVolunteers: Number(createForm.neededVolunteers),
    };
    const result = await onCreateOrUpdateEvent(payload);
    setSavingCreate(false);

    if (!result?.ok) {
      setActionError(result?.error || 'Could not save event.');
      return;
    }

    setCreateForm(blankForm);
    setCreateImageName('');
    setCreateErrors({});
  }

  function openEditEvent(event) {
    setEditForm(mapEventToForm(event));
    setEditErrors({});
    setActionError('');
    setEditImageName('');
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditForm(blankForm);
    setEditImageName('');
    setEditErrors({});
  }

  async function saveEditedEvent(e) {
    e.preventDefault();
    if (!validate(editForm, setEditErrors)) return;

    setSavingEdit(true);
    setActionError('');
    const payload = {
      ...editForm,
      neededVolunteers: Number(editForm.neededVolunteers),
    };

    const result = await onCreateOrUpdateEvent(payload);
    setSavingEdit(false);

    if (!result?.ok) {
      setActionError(result?.error || 'Could not update event.');
      return;
    }

    closeEditModal();
  }

  async function decide(applicationId, status) {
    setActionError('');
    const result = await onDecision(applicationId, status);
    if (!result?.ok) setActionError(result?.error || 'Could not update decision.');
  }

  async function updateAssignment(application) {
    setActionError('');
    const draft = assignmentDrafts[application.id] || '';
    if (!draft.trim()) return;
    const result = await onAssignment(application.id, { addTask: draft.trim() });
    if (result?.ok) {
      setAssignmentDrafts((prev) => ({ ...prev, [application.id]: '' }));
    }
    if (!result?.ok) setActionError(result?.error || 'Could not save assignment.');
  }

  async function toggleAttendance(application) {
    setActionError('');
    const result = await onAssignment(application.id, { attendance: !application.attendance });
    if (!result?.ok) setActionError(result?.error || 'Could not update attendance.');
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Coordinator Dashboard</h1>
        <p className="mt-2 text-slate-600">Create your club events, review applicants, assign tasks, and track completion.</p>
      </header>

      {!isApproved && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-black text-amber-800">Waiting For Admin Approval</h2>
          <p className="mt-2 text-sm text-amber-700">
            Your coordinator account is pending admin approval. You can view this page, but event management is locked until approved.
          </p>
        </section>
      )}

      {actionError && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{actionError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-900">Create Event</h2>

          <form
            onSubmit={saveCreateEvent}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Club</label>
              <input
                value={currentUser?.club || ''}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Title *</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!isApproved || savingCreate}
              />
              {createErrors.title && <p className="mt-1 text-xs font-semibold text-red-600">{createErrors.title}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Date *</label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!isApproved || savingCreate}
                />
                {createErrors.date && <p className="mt-1 text-xs font-semibold text-red-600">{createErrors.date}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Location *</label>
                <input
                  value={createForm.location}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!isApproved || savingCreate}
                />
                {createErrors.location && <p className="mt-1 text-xs font-semibold text-red-600">{createErrors.location}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Volunteers Needed *</label>
              <input
                type="number"
                min={1}
                value={createForm.neededVolunteers}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, neededVolunteers: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!isApproved || savingCreate}
              />
              {createErrors.neededVolunteers && <p className="mt-1 text-xs font-semibold text-red-600">{createErrors.neededVolunteers}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Background Image</label>
              <div className="flex gap-2">
                <input
                  value={createImageName}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => createImageInputRef.current?.click()}
                  disabled={!isApproved || savingCreate}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Browse
                </button>
              </div>
              <input
                ref={createImageInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const imageUrl = await toDataUrl(file);
                    setCreateForm((prev) => ({ ...prev, imageUrl }));
                    setCreateImageName(file.name);
                    e.target.value = '';
                  } catch (err) {
                    setActionError(err.message || 'Image upload failed.');
                  }
                }}
                className="hidden"
                disabled={!isApproved || savingCreate}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Details</label>
              <textarea
                value={createForm.details}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, details: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={3}
                disabled={!isApproved || savingCreate}
              />
            </div>

            <button
              type="submit"
              disabled={!isApproved || savingCreate}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {savingCreate ? 'Saving...' : 'Create Event'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-900">Manage Applicants</h2>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Created Events</label>
              <select
                value={selectedApplicantEvent}
                onChange={(e) => setSelectedApplicantEvent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Created Events</option>
                {myEvents.map((event) => (
                  <option key={event.id} value={String(event.id)}>
                    {event.title} ({event.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Applicants / Volunteers</label>
              <select
                value={applicantView}
                onChange={(e) => setApplicantView(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="applicants">Applicants ({applicantCounts.applicants})</option>
                <option value="volunteers">Volunteers ({applicantCounts.volunteers})</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredApplicants.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No entries found for the selected filters.
              </p>
            )}

            {filteredApplicants.map((application) => {
              const normalizedAssignedTasks = normalizeAssignedTasks(
                application.assignedTasks,
                Boolean(application.taskCompleted),
              );
              const completedTaskCount = normalizedAssignedTasks.filter((task) => task.completed).length;

              return (
              <div key={application.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{application.volunteerName}</p>
                    <p className="text-xs text-slate-500">{application.volunteerEmail}</p>
                    <p className="text-sm text-slate-600">{application.eventTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {application.status === 'Approved' && normalizedAssignedTasks.length > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">Task Assigned</span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-600">
                  Task completion: {completedTaskCount}/{normalizedAssignedTasks.length || 0} completed
                </p>

                {application.status === 'Applied' && isApproved && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => decide(application.id, 'Approved')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => decide(application.id, 'Rejected')}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {application.status === 'Approved' && isApproved && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      value={assignmentDrafts[application.id] ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAssignmentDrafts((prev) => ({ ...prev, [application.id]: value }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateAssignment(application);
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Type task and press Enter"
                    />
                    <button
                      onClick={() => updateAssignment(application)}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white"
                    >
                      Add Task
                    </button>
                    <button
                      onClick={() => toggleAttendance(application)}
                      className={`rounded-lg px-3 py-2 text-sm font-bold ${application.attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}
                    >
                      {application.attendance ? 'Attendance Marked' : 'Mark Attendance'}
                    </button>
                  </div>
                )}

                {application.status === 'Approved' && normalizedAssignedTasks.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {normalizedAssignedTasks.map((task, idx) => (
                      <li key={`${application.id}-${idx}`} className="flex items-center justify-between gap-2">
                        <span>{task.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${task.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {task.completed ? 'Completed' : 'Pending'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">My Current Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Event</th>
                <th className="py-2 font-bold">Club</th>
                <th className="py-2 font-bold">Date</th>
                <th className="py-2 font-bold">Location</th>
                <th className="py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event) => (
                <tr key={event.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{event.title}</td>
                  <td className="py-2 text-slate-700">{event.club}</td>
                  <td className="py-2 text-slate-700">{event.date}</td>
                  <td className="py-2 text-slate-700">{event.location}</td>
                  <td className="py-2">
                    <button
                      onClick={() => openEditEvent(event)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700"
                      disabled={!isApproved}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {currentEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">No events created by you yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">My Past Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Event</th>
                <th className="py-2 font-bold">Club</th>
                <th className="py-2 font-bold">Date</th>
                <th className="py-2 font-bold">Location</th>
              </tr>
            </thead>
            <tbody>
              {pastEvents.map((event) => (
                <tr key={event.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{event.title}</td>
                  <td className="py-2 text-slate-700">{event.club}</td>
                  <td className="py-2 text-slate-700">{event.date}</td>
                  <td className="py-2 text-slate-700">{event.location}</td>
                </tr>
              ))}
              {pastEvents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">No past events yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-black text-slate-900">Edit Event</h3>
              <button
                onClick={closeEditModal}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={saveEditedEvent}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Title *</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!isApproved || savingEdit}
                />
                {editErrors.title && <p className="mt-1 text-xs font-semibold text-red-600">{editErrors.title}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    disabled={!isApproved || savingEdit}
                  />
                  {editErrors.date && <p className="mt-1 text-xs font-semibold text-red-600">{editErrors.date}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Location *</label>
                  <input
                    value={editForm.location}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    disabled={!isApproved || savingEdit}
                  />
                  {editErrors.location && <p className="mt-1 text-xs font-semibold text-red-600">{editErrors.location}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Volunteers Needed *</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.neededVolunteers}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, neededVolunteers: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!isApproved || savingEdit}
                />
                {editErrors.neededVolunteers && <p className="mt-1 text-xs font-semibold text-red-600">{editErrors.neededVolunteers}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Background Image (optional)</label>
                <div className="flex gap-2">
                  <input
                    value={editImageName}
                    readOnly
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => editImageInputRef.current?.click()}
                    disabled={!isApproved || savingEdit}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Browse
                  </button>
                </div>
                <input
                  ref={editImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const imageUrl = await toDataUrl(file);
                      setEditForm((prev) => ({ ...prev, imageUrl }));
                      setEditImageName(file.name);
                      e.target.value = '';
                    } catch (err) {
                      setActionError(err.message || 'Image upload failed.');
                    }
                  }}
                  className="hidden"
                  disabled={!isApproved || savingEdit}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Details</label>
                <textarea
                  value={editForm.details}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, details: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows={3}
                  disabled={!isApproved || savingEdit}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isApproved || savingEdit}
                  className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
