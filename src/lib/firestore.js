import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

/* ---- Projects ---- */
export async function createProject(data) {
  const ref = await addDoc(collection(db, 'projects'), {
    ...data,
    columns: [
      { id: 'todo', name: 'To Do', order: 0 },
      { id: 'in-progress', name: 'In Progress', order: 1 },
      { id: 'in-review', name: 'In Review', order: 2 },
      { id: 'done', name: 'Done', order: 3 },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToProjects(userId, callback) {
  const q = query(
    collection(db, 'projects'),
    where('members', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateProject(projectId, data) {
  await updateDoc(doc(db, 'projects', projectId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, 'projects', projectId));
}

/* ---- Tasks ---- */
export async function createTask(projectId, data) {
  const ref = await addDoc(collection(db, 'projects', projectId, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToTasks(projectId, callback) {
  const q = query(
    collection(db, 'projects', projectId, 'tasks'),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateTask(projectId, taskId, data) {
  await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(projectId, taskId) {
  await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
}

/* ---- Messages ---- */
export async function sendMessage(projectId, data) {
  await addDoc(collection(db, 'projects', projectId, 'messages'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToMessages(projectId, callback) {
  const q = query(
    collection(db, 'projects', projectId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ---- Activity ---- */
export async function logActivity(projectId, data) {
  await addDoc(collection(db, 'projects', projectId, 'activity'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToActivity(projectId, callback, limitCount = 30) {
  const q = query(
    collection(db, 'projects', projectId, 'activity'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, limitCount));
  });
}

/* ---- Meetings ---- */
export async function createMeeting(data) {
  const ref = await addDoc(collection(db, 'meetings'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToMeetings(projectId, callback) {
  const q = query(
    collection(db, 'meetings'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createMeetingTodo(meetingId, data) {
  const ref = await addDoc(collection(db, 'meetings', meetingId, 'todos'), {
    ...data,
    completed: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToMeetingTodos(meetingId, callback) {
  const q = query(
    collection(db, 'meetings', meetingId, 'todos'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateMeetingTodo(meetingId, todoId, data) {
  await updateDoc(doc(db, 'meetings', meetingId, 'todos', todoId), data);
}

export async function deleteMeetingTodo(meetingId, todoId) {
  await deleteDoc(doc(db, 'meetings', meetingId, 'todos', todoId));
}

/* ---- Users ---- */
export async function setUserProfile(uid, data) {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
