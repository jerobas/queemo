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

const reactive = <T>(initial: T) => new ObservableState<T>(initial);

export {reactive}