import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestoreModule from 'firebase/firestore';
import {
  createProject, subscribeToProjects, updateProject, deleteProject,
  createTask, subscribeToTasks, updateTask, deleteTask,
  sendMessage, subscribeToMessages,
  logActivity, subscribeToActivity,
  createMeeting, subscribeToMeetings,
  createMeetingTodo, subscribeToMeetingTodos, updateMeetingTodo, deleteMeetingTodo,
  setUserProfile, getUserProfile, subscribeToUsers
} from './firestore';

vi.mock('firebase/firestore', async () => {
  return {
    collection: vi.fn((db, ...paths) => paths.join('/')),
    doc: vi.fn((db, ...paths) => paths.join('/')),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn((coll, ...args) => ({ coll, args })),
    where: vi.fn((f, op, val) => ({ type: 'where', f, op, val })),
    orderBy: vi.fn((f, dir) => ({ type: 'orderBy', f, dir })),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    setDoc: vi.fn(),
  };
});

vi.mock('./firebase', () => ({ db: 'mock-db' }));

describe('Firestore API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Projects', () => {
    it('createProject adds a document with initial columns', async () => {
      firestoreModule.addDoc.mockResolvedValueOnce({ id: 'proj-123' });
      const id = await createProject({ name: 'Test' });
      expect(id).toBe('proj-123');
      expect(firestoreModule.addDoc).toHaveBeenCalledWith(
        'projects',
        expect.objectContaining({
          name: 'Test',
          columns: expect.any(Array),
          createdAt: 'mock-server-timestamp',
          updatedAt: 'mock-server-timestamp'
        })
      );
      // Ensure specific columns are generated to survive mutation testing
      const callArgs = firestoreModule.addDoc.mock.calls[0][1];
      expect(callArgs.columns[0]).toEqual({ id: 'todo', name: 'To Do', order: 0 });
    });

    it('subscribeToProjects sets up snapshot listener', () => {
      const callback = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((q, cb) => {
        cb({ docs: [{ id: '1', data: () => ({ name: 'P1' }) }] });
        return 'unsub';
      });
      const unsub = subscribeToProjects('user-1', callback);
      expect(unsub).toBe('unsub');
      expect(firestoreModule.where).toHaveBeenCalledWith('members', 'array-contains', 'user-1');
      expect(firestoreModule.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(callback).toHaveBeenCalledWith([{ id: '1', name: 'P1' }]);
    });

    it('updateProject calls updateDoc', async () => {
      await updateProject('proj-1', { name: 'New' });
      expect(firestoreModule.updateDoc).toHaveBeenCalledWith('projects/proj-1', { name: 'New', updatedAt: 'mock-server-timestamp' });
    });

    it('deleteProject calls deleteDoc', async () => {
      await deleteProject('proj-1');
      expect(firestoreModule.deleteDoc).toHaveBeenCalledWith('projects/proj-1');
    });
  });

  describe('Tasks', () => {
    it('createTask adds a task', async () => {
      firestoreModule.addDoc.mockResolvedValueOnce({ id: 'task-1' });
      const id = await createTask('proj-1', { title: 'Test Task' });
      expect(id).toBe('task-1');
      expect(firestoreModule.collection).toHaveBeenCalledWith('mock-db', 'projects', 'proj-1', 'tasks');
    });

    it('subscribeToTasks listens to tasks', () => {
      const cb = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((q, callback) => callback({ docs: [] }));
      subscribeToTasks('proj-1', cb);
      expect(firestoreModule.orderBy).toHaveBeenCalledWith('order', 'asc');
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('updateTask updates task', async () => {
      await updateTask('proj-1', 'task-1', { status: 'done' });
      expect(firestoreModule.updateDoc).toHaveBeenCalledWith('projects/proj-1/tasks/task-1', expect.objectContaining({ status: 'done' }));
    });

    it('deleteTask deletes task', async () => {
      await deleteTask('proj-1', 'task-1');
      expect(firestoreModule.deleteDoc).toHaveBeenCalledWith('projects/proj-1/tasks/task-1');
    });
  });

  describe('Messages', () => {
    it('sendMessage adds message', async () => {
      await sendMessage('proj-1', { text: 'Hello' });
      expect(firestoreModule.addDoc).toHaveBeenCalledWith('projects/proj-1/messages', expect.objectContaining({ text: 'Hello' }));
    });

    it('subscribeToMessages listens to messages', () => {
      const cb = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((q, callback) => callback({ docs: [] }));
      subscribeToMessages('proj-1', cb);
      expect(firestoreModule.orderBy).toHaveBeenCalledWith('createdAt', 'asc');
    });
  });

  describe('Activity', () => {
    it('logActivity adds activity', async () => {
      await logActivity('proj-1', { action: 'moved' });
      expect(firestoreModule.addDoc).toHaveBeenCalledWith('projects/proj-1/activity', expect.objectContaining({ action: 'moved' }));
    });

    it('subscribeToActivity listens to activity with limit', () => {
      const cb = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((q, callback) => {
        // Mock returning 2 docs, test limit functionality
        callback({ docs: [{ id: '1', data: () => ({}) }, { id: '2', data: () => ({}) }] });
      });
      subscribeToActivity('proj-1', cb, 1);
      expect(firestoreModule.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      // Should be sliced to 1
      expect(cb).toHaveBeenCalledWith([{ id: '1' }]);
    });
  });

  describe('Meetings', () => {
    it('createMeeting adds meeting', async () => {
      firestoreModule.addDoc.mockResolvedValueOnce({ id: 'm-1' });
      expect(await createMeeting({ title: 'Standup' })).toBe('m-1');
    });

    it('subscribeToMeetings listens to meetings', () => {
      const cb = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((q, callback) => callback({ docs: [] }));
      subscribeToMeetings('proj-1', cb);
      expect(firestoreModule.where).toHaveBeenCalledWith('projectId', '==', 'proj-1');
    });

    it('createMeetingTodo adds todo', async () => {
      firestoreModule.addDoc.mockResolvedValueOnce({ id: 't-1' });
      expect(await createMeetingTodo('m-1', { text: 'do it' })).toBe('t-1');
      expect(firestoreModule.addDoc).toHaveBeenCalledWith('meetings/m-1/todos', expect.objectContaining({ completed: false }));
    });

    it('subscribeToMeetingTodos listens', () => {
      const cb = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((q, callback) => callback({ docs: [] }));
      subscribeToMeetingTodos('m-1', cb);
      expect(firestoreModule.orderBy).toHaveBeenCalledWith('createdAt', 'asc');
    });

    it('updateMeetingTodo updates todo', async () => {
      await updateMeetingTodo('m-1', 't-1', { completed: true });
      expect(firestoreModule.updateDoc).toHaveBeenCalledWith('meetings/m-1/todos/t-1', { completed: true });
    });

    it('deleteMeetingTodo deletes todo', async () => {
      await deleteMeetingTodo('m-1', 't-1');
      expect(firestoreModule.deleteDoc).toHaveBeenCalledWith('meetings/m-1/todos/t-1');
    });
  });

  describe('Users', () => {
    it('setUserProfile merges profile', async () => {
      await setUserProfile('u-1', { name: 'John' });
      expect(firestoreModule.setDoc).toHaveBeenCalledWith('users/u-1', expect.objectContaining({ name: 'John' }), { merge: true });
    });

    it('getUserProfile returns data if exists', async () => {
      firestoreModule.getDoc.mockResolvedValueOnce({ exists: () => true, id: 'u-1', data: () => ({ name: 'John' }) });
      expect(await getUserProfile('u-1')).toEqual({ id: 'u-1', name: 'John' });
    });

    it('getUserProfile returns null if missing', async () => {
      firestoreModule.getDoc.mockResolvedValueOnce({ exists: () => false });
      expect(await getUserProfile('u-1')).toBeNull();
    });

    it('subscribeToUsers listens', () => {
      const cb = vi.fn();
      firestoreModule.onSnapshot.mockImplementationOnce((c, callback) => callback({ docs: [] }));
      subscribeToUsers(cb);
      expect(firestoreModule.collection).toHaveBeenCalledWith('mock-db', 'users');
    });
  });
});
