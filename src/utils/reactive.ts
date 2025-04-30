type Listener<T> = (val: T) => void;

class ObservableState<T> {
  private value: T;
  private listeners: Listener<T>[] = [];

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    if (this.value === newValue) return;
    this.value = newValue;
    this.emit();
  }

  onChange(cb: Listener<T>): void {
    this.listeners.push(cb);
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.value);
  }

  clear(): void {
    this.listeners = []
  }
}

class ObservableRecord<T> extends ObservableState<Record<string, T>> {
  constructor(initial: Record<string, T> = {}) {
    super(initial);
  }

  patch(key: string, val: T): void {
    const newValue = { ...this.get(), [key]: val };
    this.set(newValue);
  }

  delete(key: string): void {
    const current = this.get();
    if (!(key in current)) return;

    const newValue = { ...current };
    delete newValue[key];
    this.set(newValue);
  }
}

const reactive = <T>(initial: T) => new ObservableState<T>(initial);
const reactiveRecord = <T>(initial: Record<string, T>) => new ObservableRecord<T>(initial);

export { reactive, reactiveRecord }