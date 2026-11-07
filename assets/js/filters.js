/**
 * ManageLinks - Filter State & Utilities
 * Developer: Devraj Chauhan
 */

export class FilterState {
  constructor(initial = {}) {
    this.state = {
      query: '',
      categoryId: null,
      folderId: null,
      collectionId: null,
      tag: null,
      isFavorite: undefined,
      isPinned: undefined,
      isArchived: false,
      isReadLater: undefined,
      readingStatus: null,
      inboxOnly: false,
      sortBy: 'newest',
      viewMode: 'grid', // 'grid', 'list', 'compact'
      ...initial
    };
    this.listeners = new Set();
  }

  get() {
    return { ...this.state };
  }

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  reset() {
    this.state = {
      query: '',
      categoryId: null,
      folderId: null,
      collectionId: null,
      tag: null,
      isFavorite: undefined,
      isPinned: undefined,
      isArchived: false,
      isReadLater: undefined,
      readingStatus: null,
      inboxOnly: false,
      sortBy: this.state.sortBy,
      viewMode: this.state.viewMode
    };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  hasActiveFilters() {
    return !!(
      this.state.query ||
      this.state.categoryId ||
      this.state.folderId ||
      this.state.collectionId ||
      this.state.tag ||
      this.state.readingStatus ||
      this.state.isFavorite ||
      this.state.isPinned
    );
  }
}
